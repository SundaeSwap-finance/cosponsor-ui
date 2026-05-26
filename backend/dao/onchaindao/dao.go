package onchaindao

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/savaki/ddb"
)

// ErrNotFound signals a missing row.
var ErrNotFound = errors.New("document not found")

// DAO is the data-access object for indexed CIP-184 documents.
type DAO struct {
	table *ddb.Table
}

// New constructs a DAO bound to a specific table name. Production
// callers should prefer Build().
func New(api dynamodbiface.DynamoDBAPI, tableName string) *DAO {
	return &DAO{
		table: ddb.New(api).MustTable(tableName, &AnchoredDocument{}),
	}
}

// Table exposes the underlying ddb.Table for one-off queries.
func (d *DAO) Table() *ddb.Table { return d.table }

// Upsert writes (or overwrites) a document. The indexer is
// idempotent — re-processing the same transaction must be safe —
// so we always Put rather than ConditionExpression-protect.
func (d *DAO) Upsert(ctx context.Context, doc *AnchoredDocument) error {
	if doc == nil {
		return fmt.Errorf("nil document")
	}
	if doc.AnchorRef == "" {
		return fmt.Errorf("missing anchor_ref")
	}
	if doc.IndexedAt.IsZero() {
		doc.IndexedAt = time.Now().UTC()
	}
	if err := d.table.Put(doc).RunWithContext(ctx); err != nil {
		return fmt.Errorf("put anchored document: %w", err)
	}
	return nil
}

// Delete removes an anchored document. Used on chain rollback.
func (d *DAO) Delete(ctx context.Context, anchorRef string) error {
	if err := d.table.Delete(anchorRef).RunWithContext(ctx); err != nil {
		return fmt.Errorf("delete anchored document %s: %w", anchorRef, err)
	}
	return nil
}

// Get fetches a document by anchor reference.
func (d *DAO) Get(ctx context.Context, anchorRef string) (AnchoredDocument, error) {
	var doc AnchoredDocument
	err := d.table.Get(anchorRef).ScanWithContext(ctx, &doc)
	if err != nil {
		if ddb.IsItemNotFoundError(err) {
			return AnchoredDocument{}, ErrNotFound
		}
		return AnchoredDocument{}, fmt.Errorf("get %s: %w", anchorRef, err)
	}
	return doc, nil
}

// ListBySubject returns every feedback / addendum / etc. that
// references the given subject (typically an actionId).
func (d *DAO) ListBySubject(ctx context.Context, subjectKey string) ([]AnchoredDocument, error) {
	var rows []AnchoredDocument
	err := d.table.Query("#SubjectKey = ?", subjectKey).
		IndexName("BySubject").
		FindAllWithContext(ctx, &rows)
	if err != nil {
		return nil, fmt.Errorf("query BySubject: %w", err)
	}
	return rows, nil
}

// ListByType returns every document of a given CIP-184 @type.
// Mostly useful for surfacing standalone DraftProposal docs.
func (d *DAO) ListByType(ctx context.Context, docType string) ([]AnchoredDocument, error) {
	var rows []AnchoredDocument
	err := d.table.Query("#DocType = ?", docType).
		IndexName("ByDocType").
		FindAllWithContext(ctx, &rows)
	if err != nil {
		return nil, fmt.Errorf("query ByDocType: %w", err)
	}
	return rows, nil
}
