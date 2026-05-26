package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/onchaindao"
	"github.com/SundaeSwap-finance/cosponsor-ui/backend/shared/cip184"
	sundaecli "github.com/SundaeSwap-finance/sundae-go-utils/sundae-cli"
	"github.com/blinklabs-io/gouroboros/ledger"
	"github.com/rs/zerolog"
)

// Handler is the sync-v2-consumer callback bundle for the on-chain
// CIP-184 indexer. The indexer scans transaction metadata for label
// 1694 — the CIP-100 anchor label CIP-184 uses — decodes the JSON,
// classifies it by @type, and persists it to onchaindao.
type Handler struct {
	logger  zerolog.Logger
	onchain *onchaindao.DAO
}

// rollForward is called once per transaction as the chain advances.
func (h *Handler) rollForward(ctx context.Context, tx ledger.Transaction, slot uint64, _ int) error {
	docs := extractCIP184Documents(tx)
	if len(docs) == 0 {
		return nil
	}
	for _, doc := range docs {
		doc.Slot = slot
		if sundaecli.CommonOpts.Dry {
			h.logger.Info().
				Str("tx", doc.TxHash).
				Uint64("slot", slot).
				Str("@type", doc.DocType).
				Str("subject", doc.SubjectKey).
				Msg("would index CIP-184 document")
			continue
		}
		if err := h.onchain.Upsert(ctx, &doc); err != nil {
			h.logger.Error().Err(err).Str("anchor", doc.AnchorRef).Msg("failed to persist on-chain document")
			return err
		}
		h.logger.Info().
			Str("anchor", doc.AnchorRef).
			Str("@type", doc.DocType).
			Msg("indexed CIP-184 document")
	}
	return nil
}

// rollBack is called when the upstream sync replays a fork; the
// indexer must un-do whatever rollForward wrote for the same tx.
func (h *Handler) rollBack(ctx context.Context, tx ledger.Transaction, _ uint64) error {
	docs := extractCIP184Documents(tx)
	if len(docs) == 0 {
		return nil
	}
	for _, doc := range docs {
		if sundaecli.CommonOpts.Dry {
			h.logger.Info().Str("anchor", doc.AnchorRef).Msg("would delete on-chain document (rollback)")
			continue
		}
		if err := h.onchain.Delete(ctx, doc.AnchorRef); err != nil {
			h.logger.Error().Err(err).Str("anchor", doc.AnchorRef).Msg("failed to delete on-chain document")
			return err
		}
	}
	return nil
}

// extractCIP184Documents pulls every CIP-184-shaped JSON document
// out of a transaction's auxiliary metadata.
//
// We look at metadatum label 1694 (per CIP-100 / CIP-184). The
// returned slice is empty whenever the transaction either has no
// auxiliary data or carries an unrelated label.
//
// The metadatum payload can either be the inlined JSON-LD document
// or a `{uri, hash}` reference; we record the reference verbatim
// and leave dereferencing the URI to a separate fetcher. Tooling
// reading these rows can identify the two cases by inspecting
// `external` and `raw_document`.
func extractCIP184Documents(tx ledger.Transaction) []onchaindao.AnchoredDocument {
	metaLazy := tx.Metadata()
	if metaLazy == nil {
		return nil
	}
	raw, ok := metadataValueForLabel(metaLazy.Value(), cip184.MetadataLabel1694)
	if !ok {
		return nil
	}

	txHash := tx.Hash().String()
	jsonBytes, err := metadatumToJSON(raw)
	if err != nil {
		return nil
	}

	// Two shapes are common at label 1694:
	//   1. An inlined CIP-100 document — has @type / body.
	//   2. A {uri, hash} reference to a doc hosted elsewhere.
	// Try (1) first; fall back to (2).
	if docs := decodeInlineDocuments(jsonBytes, txHash); len(docs) > 0 {
		return docs
	}
	if ref := decodeReference(jsonBytes, txHash); ref != nil {
		return []onchaindao.AnchoredDocument{*ref}
	}
	return nil
}

// decodeInlineDocuments handles the inlined case. The metadatum's
// JSON can either be a single CIP-184 document or an array of them
// (CIP-100 permits both).
func decodeInlineDocuments(jsonBytes []byte, txHash string) []onchaindao.AnchoredDocument {
	var single cip184.Document
	if err := json.Unmarshal(jsonBytes, &single); err == nil && single.Type != "" {
		return []onchaindao.AnchoredDocument{
			documentToRow(single, jsonBytes, txHash, 0, false),
		}
	}
	var many []cip184.Document
	if err := json.Unmarshal(jsonBytes, &many); err == nil {
		out := make([]onchaindao.AnchoredDocument, 0, len(many))
		for i, doc := range many {
			if doc.Type == "" {
				continue
			}
			docBytes, _ := json.Marshal(doc)
			out = append(out, documentToRow(doc, docBytes, txHash, i, false))
		}
		return out
	}
	return nil
}

// decodeReference handles the {uri, hash} case. Indexing the
// reference itself is useful: it makes the anchor discoverable,
// while a downstream fetcher can populate `raw_document` later by
// retrieving the URI and verifying the hash.
func decodeReference(jsonBytes []byte, txHash string) *onchaindao.AnchoredDocument {
	var ref struct {
		URI  string `json:"uri"`
		Hash string `json:"hash"`
	}
	if err := json.Unmarshal(jsonBytes, &ref); err != nil || ref.URI == "" {
		return nil
	}
	return &onchaindao.AnchoredDocument{
		AnchorRef:   fmt.Sprintf("%s#%d", txHash, cip184.MetadataLabel1694),
		TxHash:      txHash,
		RawDocument: string(jsonBytes),
		External:    true,
	}
}

// documentToRow projects a decoded CIP-184 document into the
// storage row shape. `seq` distinguishes multiple documents anchored
// in the same transaction.
func documentToRow(doc cip184.Document, raw []byte, txHash string, seq int, external bool) onchaindao.AnchoredDocument {
	anchorRef := fmt.Sprintf("%s#%d", txHash, cip184.MetadataLabel1694)
	if seq > 0 {
		anchorRef += ":" + strconv.Itoa(seq)
	}

	subjectKey, subjectType := extractSubject(doc)

	return onchaindao.AnchoredDocument{
		AnchorRef:   anchorRef,
		TxHash:      txHash,
		DocType:     doc.Type,
		SubjectKey:  subjectKey,
		SubjectType: subjectType,
		RawDocument: string(raw),
		External:    external,
	}
}

// extractSubject decodes the document's body just far enough to
// pull out subject.actionId/uri for the BySubject index. Drafts
// don't have a subject; we return empty strings in that case.
func extractSubject(doc cip184.Document) (string, string) {
	body, err := doc.ParsedBody()
	if err != nil || body == nil {
		return "", ""
	}
	switch b := body.(type) {
	case *cip184.FeedbackBody:
		return subjectKey(b.Subject), b.Subject.Type
	case *cip184.AddendumBody:
		return subjectKey(b.Subject), b.Subject.Type
	}
	return "", ""
}

func subjectKey(s cip184.Subject) string {
	if s.ActionID != "" {
		return s.ActionID
	}
	return s.URI
}

// metadataValueForLabel returns the raw decoded metadatum at the
// given CIP-100 label, abstracting over the ogmigo / gouroboros
// API drift. Returns ok=false when the label is absent.
func metadataValueForLabel(metadata any, label uint64) (any, bool) {
	switch m := metadata.(type) {
	case map[uint64]any:
		v, ok := m[label]
		return v, ok
	case map[string]any:
		v, ok := m[strconv.FormatUint(label, 10)]
		return v, ok
	}
	return nil, false
}

// metadatumToJSON renders a decoded CBOR metadatum back as JSON.
// CIP-100 already constrains the metadatum to a JSON-encodable
// shape, so a plain Marshal of the parsed value is sufficient.
func metadatumToJSON(v any) ([]byte, error) {
	return json.Marshal(v)
}
