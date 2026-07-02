package proposaldao

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/gofrs/uuid"
	"github.com/savaki/ddb"
)

// ErrNotFound signals a missing proposal row.
var ErrNotFound = errors.New("proposal not found")

// DAO is the data-access object for authored proposals.
type DAO struct {
	table *ddb.Table
}

// New constructs a DAO bound to a specific table name. Production
// callers should prefer Build().
func New(api dynamodbiface.DynamoDBAPI, tableName string) *DAO {
	return &DAO{
		table: ddb.New(api).MustTable(tableName, &Proposal{}),
	}
}

// Table exposes the underlying ddb.Table for one-off queries.
func (d *DAO) Table() *ddb.Table { return d.table }

// Create inserts a new proposal. If ProposalID is empty a uuid is
// assigned. CreatedAt/UpdatedAt are stamped server-side.
func (d *DAO) Create(ctx context.Context, p *Proposal) error {
	if p == nil {
		return fmt.Errorf("nil proposal")
	}
	if p.ProposalID == "" {
		id, err := uuid.NewV4()
		if err != nil {
			return fmt.Errorf("generate proposal id: %w", err)
		}
		p.ProposalID = id.String()
	}
	now := time.Now().UTC()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	if !p.IsSubmitted {
		p.IsDraft = true
	}
	// prop_rev_active mirrors the GovTools convention: the most
	// recent revision is active by default.
	p.PropRevisionActive = true

	if err := d.table.Put(p).RunWithContext(ctx); err != nil {
		return fmt.Errorf("put proposal: %w", err)
	}
	return nil
}

// Get fetches a proposal by id.
func (d *DAO) Get(ctx context.Context, id string) (Proposal, error) {
	var p Proposal
	err := d.table.Get(id).ScanWithContext(ctx, &p)
	if err != nil {
		if ddb.IsItemNotFoundError(err) {
			return Proposal{}, ErrNotFound
		}
		return Proposal{}, fmt.Errorf("get proposal %s: %w", id, err)
	}
	return p, nil
}

// Update overwrites the existing row. The caller is responsible for
// passing a complete record (we are not doing patch semantics here).
// UpdatedAt is restamped server-side.
func (d *DAO) Update(ctx context.Context, p *Proposal) error {
	if p == nil || p.ProposalID == "" {
		return fmt.Errorf("update requires proposal_id")
	}
	p.UpdatedAt = time.Now().UTC()
	if err := d.table.Put(p).RunWithContext(ctx); err != nil {
		return fmt.Errorf("put proposal: %w", err)
	}
	return nil
}

// Delete removes a proposal by id.
func (d *DAO) Delete(ctx context.Context, id string) error {
	if err := d.table.Delete(id).RunWithContext(ctx); err != nil {
		return fmt.Errorf("delete proposal %s: %w", id, err)
	}
	return nil
}

// List returns up to `limit` proposals starting at offset `start`.
// We use a Scan rather than a Query because there is no natural
// partition key — the UI's "all proposals" view spans the whole
// table. The full result set is buffered in memory and then sliced;
// at our expected scale (low thousands of proposals) this is the
// simplest correct option and avoids exposing DynamoDB cursor
// tokens through the public API.
func (d *DAO) List(ctx context.Context, start, limit int, sortSpec string) ([]Proposal, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var all []Proposal
	err := d.table.Scan().EachWithContext(ctx, func(item ddb.Item) (bool, error) {
		var p Proposal
		if err := item.Unmarshal(&p); err != nil {
			return false, err
		}
		all = append(all, p)
		return true, nil
	})
	if err != nil {
		return nil, 0, fmt.Errorf("scan proposals: %w", err)
	}
	SortProposals(all, sortSpec)
	total := len(all)
	if start >= total {
		return nil, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return all[start:end], total, nil
}

// ListByUser returns proposals authored by a specific user_id, using
// the ByUser GSI.
func (d *DAO) ListByUser(ctx context.Context, userID string) ([]Proposal, error) {
	var rows []Proposal
	err := d.table.Query("#UserID = ?", userID).
		IndexName("ByUser").
		FindAllWithContext(ctx, &rows)
	if err != nil {
		return nil, fmt.Errorf("query ByUser: %w", err)
	}
	return rows, nil
}

// ListByActionType returns proposals of a specific gov action type
// (e.g. "Treasury Withdrawal"), using the ByActionType GSI.
func (d *DAO) ListByActionType(ctx context.Context, actionType string) ([]Proposal, error) {
	var rows []Proposal
	err := d.table.Query("#GovActionType = ?", actionType).
		IndexName("ByActionType").
		FindAllWithContext(ctx, &rows)
	if err != nil {
		return nil, fmt.Errorf("query ByActionType: %w", err)
	}
	return rows, nil
}

// ActiveCategories returns the set of gov_action_type values that
// have at least one non-draft proposal. Used to decide which
// categories still need a demo/example proposal injected into the
// API response.
func (d *DAO) ActiveCategories(ctx context.Context) (map[string]bool, error) {
	active := map[string]bool{}
	err := d.table.Scan().EachWithContext(ctx, func(item ddb.Item) (bool, error) {
		var p Proposal
		if err := item.Unmarshal(&p); err != nil {
			return false, err
		}
		if !p.IsDraft {
			active[p.GovActionType] = true
		}
		return true, nil
	})
	if err != nil {
		return nil, fmt.Errorf("scan proposals: %w", err)
	}
	return active, nil
}
