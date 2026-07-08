package main

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/blake2b"
)

// GET /proposals/{id}/metadata.jsonld — CIP-108 governance metadata generated
// from the proposal's own content. The frontend bakes this URL plus the
// blake2b-256 of the EXACT served bytes into the proposal's on-chain anchor
// at first pledge, so explorers (adastat, gov.tools) can fetch + verify it.
//
// DETERMINISM CONTRACT: the anchor hash is immutable once pledged/submitted.
// This generator must therefore be byte-stable for unchanged content —
// struct-ordered json.MarshalIndent, no timestamps, no map iteration. Editing
// a proposal's name/abstract/... after its pool exists breaks hash
// verification for that pool's anchor (the on-chain hash captures the OLD
// content); that is inherent to content-addressed anchors, not a bug here.

// cip108Context is the standard CIP-100/CIP-108 @context, kept as a fixed
// raw block so serialization is byte-stable.
var cip108Context = json.RawMessage(`{
    "@language": "en-us",
    "CIP100": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    "CIP108": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#",
    "hashAlgorithm": "CIP100:hashAlgorithm",
    "body": {
      "@id": "CIP108:body",
      "@context": {
        "references": {
          "@id": "CIP108:references",
          "@container": "@set",
          "@context": {
            "GovernanceMetadata": "CIP100:GovernanceMetadataReference",
            "Other": "CIP100:OtherReference",
            "label": "CIP100:reference-label",
            "uri": "CIP100:reference-uri"
          }
        },
        "title": "CIP108:title",
        "abstract": "CIP108:abstract",
        "motivation": "CIP108:motivation",
        "rationale": "CIP108:rationale"
      }
    },
    "authors": {
      "@id": "CIP100:authors",
      "@container": "@set",
      "@context": {
        "name": "http://xmlns.com/foaf/0.1/name"
      }
    }
  }`)

type cip108Body struct {
	Title      string `json:"title"`
	Abstract   string `json:"abstract"`
	Motivation string `json:"motivation"`
	Rationale  string `json:"rationale"`
}

type cip108Document struct {
	Context       json.RawMessage `json:"@context"`
	HashAlgorithm string          `json:"hashAlgorithm"`
	Authors       []any           `json:"authors"`
	Body          cip108Body      `json:"body"`
}

// apiPublicBaseURL is the absolute origin baked into anchor URLs. The
// on-chain anchor must be absolute and stable across deploys.
func apiPublicBaseURL() string {
	if v := os.Getenv("API_PUBLIC_BASE_URL"); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://api.cosponsor.preview.sundae.fi"
}

func metadataURLFor(proposalID string) string {
	return fmt.Sprintf("%s/proposals/%s/metadata.jsonld", apiPublicBaseURL(), proposalID)
}

// buildProposalMetadata renders the CIP-108 document and its blake2b-256
// (hex) over the exact bytes served by the handler below.
func buildProposalMetadata(p proposaldao.Proposal) ([]byte, string, error) {
	// CIP-108: title max 80 chars, no markdown. Rune-safe truncation.
	title := p.Name
	if runes := []rune(title); len(runes) > 80 {
		title = string(runes[:80])
	}

	doc := cip108Document{
		Context:       cip108Context,
		HashAlgorithm: "blake2b-256",
		Authors:       []any{},
		Body: cip108Body{
			Title:      title,
			Abstract:   p.Abstract,
			Motivation: p.Motivation,
			Rationale:  p.Rationale,
		},
	}
	out, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		return nil, "", err
	}
	out = append(out, '\n')
	sum := blake2b.Sum256(out)
	return out, hex.EncodeToString(sum[:]), nil
}

// resolveProposalForMetadata loads a stored proposal, falling back to the
// synthetic demo entries (which exist only in the list injection, not the
// store).
func (h *handlerDeps) resolveProposalForMetadata(r *http.Request, id string) (proposaldao.Proposal, error) {
	p, err := h.proposals.Get(r.Context(), id)
	if err == nil {
		return p, nil
	}
	if errors.Is(err, proposaldao.ErrNotFound) && demoProposalsEnabled() {
		if demo, ok := demoProposalByID(id); ok {
			return demo, nil
		}
	}
	return proposaldao.Proposal{}, err
}

func (h *handlerDeps) getProposalMetadata(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(chi.URLParam(r, "id"))
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}
	p, err := h.resolveProposalForMetadata(r, id)
	if errors.Is(err, proposaldao.ErrNotFound) {
		writeError(w, http.StatusNotFound, "proposal not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load proposal")
		return
	}
	body, _, err := buildProposalMetadata(p)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to render metadata")
		return
	}
	// Byte-exact write — the anchor hash is over these bytes verbatim.
	w.Header().Set("Content-Type", "application/ld+json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}
