package proposaldao

import (
	"sort"
	"strings"
)

// DefaultSort orders the list view newest-first by creation time.
// Picked to match what the UI's "all proposals" page expects: a
// chronological feed with the latest authoring on top.
const DefaultSort = "created_at:desc"

// SortProposals applies a GovTools-style sort spec (e.g.
// "createdAt:desc", "updated_at:asc") to rows in place. Unknown
// fields fall back to DefaultSort so a malformed query param can't
// produce an arbitrary order.
func SortProposals(rows []Proposal, spec string) {
	field, desc := parseSort(spec)
	less := lessFor(field)
	sort.SliceStable(rows, func(i, j int) bool {
		if desc {
			return less(rows[j], rows[i])
		}
		return less(rows[i], rows[j])
	})
}

func parseSort(spec string) (field string, desc bool) {
	if spec == "" {
		spec = DefaultSort
	}
	parts := strings.SplitN(spec, ":", 2)
	field = normalizeField(parts[0])
	desc = len(parts) == 2 && strings.EqualFold(parts[1], "desc")
	return
}

func normalizeField(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "updatedat", "updated_at":
		return "updated_at"
	case "submissiondate", "submission_date", "prop_submission_date":
		return "submission_date"
	default:
		return "created_at"
	}
}

func lessFor(field string) func(a, b Proposal) bool {
	switch field {
	case "updated_at":
		return func(a, b Proposal) bool { return a.UpdatedAt.Before(b.UpdatedAt) }
	case "submission_date":
		return func(a, b Proposal) bool { return a.SubmissionDate < b.SubmissionDate }
	default:
		return func(a, b Proposal) bool { return a.CreatedAt.Before(b.CreatedAt) }
	}
}
