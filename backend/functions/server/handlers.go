package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
	"github.com/go-chi/chi/v5"
)

// writeJSON serializes v as JSON and writes it with the given
// status. It is the single point where Content-Type is set so the
// handlers below stay free of header noise.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError is the canonical error response shape. We avoid
// leaking internal error strings to callers — handlers should pass
// a user-facing summary and log the real error.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{
		"error": map[string]any{
			"status":  status,
			"message": msg,
		},
	})
}

func (h *handlerDeps) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": os.Getenv("VERSION"),
	})
}

// listProposals implements GET /proposals.
//
// Honours the GovTools "pagination[start]" / "pagination[limit]"
// query params the frontend already sends. Filtering by
// `gov_action_type` is exposed as a convenience but is optional —
// the UI today filters client-side, and we want to keep matching
// that behaviour by default.
func (h *handlerDeps) listProposals(w http.ResponseWriter, r *http.Request) {
	start := atoiDefault(r.URL.Query().Get("pagination[start]"), 0)
	limit := atoiDefault(r.URL.Query().Get("pagination[limit]"), 20)
	actionType := r.URL.Query().Get("filters[gov_action_type]")
	includeDrafts := r.URL.Query().Get("filters[is_draft]") == "true"
	sortSpec := r.URL.Query().Get("sort")

	var (
		rows  []proposaldao.Proposal
		total int
		err   error
	)
	switch {
	case actionType != "":
		rows, err = h.proposals.ListByActionType(r.Context(), actionType)
		proposaldao.SortProposals(rows, sortSpec)
		total = len(rows)
		// Apply pagination client-side over the filtered set.
		if start < total {
			end := start + limit
			if end > total {
				end = total
			}
			rows = rows[start:end]
		} else {
			rows = nil
		}
	default:
		rows, total, err = h.proposals.List(r.Context(), start, limit, sortSpec)
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list proposals")
		return
	}

	if !includeDrafts {
		rows = filterOutDrafts(rows)
	}

	envelopes := make([]proposalEnvelope, 0, len(rows))
	for _, row := range rows {
		envelopes = append(envelopes, toEnvelope(row))
	}

	// Fill categories with no real proposals with a demo/example entry
	// so every governance-action type is always browsable. Only done on
	// the first page so pagination totals stay consistent.
	if start == 0 && demoProposalsEnabled() {
		active, actErr := h.proposals.ActiveCategories(r.Context())
		if actErr == nil {
			for _, category := range demoCategories {
				if actionType != "" && category != actionType {
					continue
				}
				if active[category] {
					continue
				}
				envelopes = append(envelopes, toEnvelope(buildDemoProposal(category)))
				total++
			}
		}
	}

	writeJSON(w, http.StatusOK, paginatedResponse[proposalEnvelope]{
		Data: envelopes,
		Meta: paginationMeta{Pagination: paginationInfo{
			Start: start,
			Limit: limit,
			Total: total,
		}},
	})
}

// getProposal implements GET /proposals/{id}.
//
// The {id} segment is the proposal_id uuid the API hands out, but
// the FNV-hashed numeric id from the response envelope is also
// accepted so the frontend can pass back the integer it received.
// We dispatch to a Scan-by-fnv when the inbound id looks numeric.
func (h *handlerDeps) getProposal(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(chi.URLParam(r, "id"))
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}

	p, err := h.proposals.Get(r.Context(), id)
	if errors.Is(err, proposaldao.ErrNotFound) {
		writeError(w, http.StatusNotFound, "proposal not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load proposal")
		return
	}
	writeJSON(w, http.StatusOK, singleResponse[proposalEnvelope]{Data: toEnvelope(p)})
}

// createProposalRequest is the body shape for POST /proposals.
// The field set is the writeable subset of proposaldao.Proposal —
// in particular, ProposalID / CreatedAt / UpdatedAt /
// PropRevisionActive are server-assigned and rejected if set by
// the client.
type createProposalRequest struct {
	UserID              string                              `json:"user_id"`
	UserName            string                              `json:"user_govtool_username,omitempty"`
	IsDraft             bool                                `json:"is_draft"`
	IsSubmitted         bool                                `json:"prop_submitted"`
	SubmissionTxHash    string                              `json:"prop_submission_tx_hash,omitempty"`
	SubmissionDate      string                              `json:"prop_submission_date,omitempty"`
	Name                string                              `json:"prop_name,omitempty"`
	Abstract            string                              `json:"prop_abstract,omitempty"`
	Motivation          string                              `json:"prop_motivation,omitempty"`
	Rationale           string                              `json:"prop_rationale,omitempty"`
	GovActionType       string                              `json:"gov_action_type_id"`
	Withdrawals         []proposaldao.Withdrawal            `json:"proposal_withdrawals,omitempty"`
	HardForkContent     *proposaldao.HardForkContent        `json:"proposal_hard_fork_content,omitempty"`
	ConstitutionContent *proposaldao.ConstitutionContent    `json:"proposal_constitution_content,omitempty"`
	Links               []proposaldao.Link                  `json:"proposal_links,omitempty"`
	RequestedBudget     int64                               `json:"requested_budget,omitempty"`
	AnchorHash          string                              `json:"anchor_hash,omitempty"`
}

// createProposal implements POST /proposals.
func (h *handlerDeps) createProposal(w http.ResponseWriter, r *http.Request) {
	var req createProposalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}
	if req.GovActionType == "" {
		writeError(w, http.StatusBadRequest, "gov_action_type_id is required")
		return
	}

	p := &proposaldao.Proposal{
		UserID:              req.UserID,
		UserName:            req.UserName,
		IsDraft:             req.IsDraft || !req.IsSubmitted,
		IsSubmitted:         req.IsSubmitted,
		SubmissionTxHash:    req.SubmissionTxHash,
		SubmissionDate:      req.SubmissionDate,
		Name:                req.Name,
		Abstract:            req.Abstract,
		Motivation:          req.Motivation,
		Rationale:           req.Rationale,
		GovActionType:       req.GovActionType,
		Withdrawals:         req.Withdrawals,
		HardForkContent:     req.HardForkContent,
		ConstitutionContent: req.ConstitutionContent,
		Links:               req.Links,
		RequestedBudget:     req.RequestedBudget,
		AnchorHash:          req.AnchorHash,
	}

	if err := h.proposals.Create(r.Context(), p); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create proposal")
		return
	}
	writeJSON(w, http.StatusCreated, singleResponse[proposalEnvelope]{Data: toEnvelope(*p)})
}

// updateProposal implements PUT /proposals/{id}. The whole record
// is replaced; partial-update semantics are intentionally not
// supported here to keep the storage layer simple.
func (h *handlerDeps) updateProposal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}

	existing, err := h.proposals.Get(r.Context(), id)
	if errors.Is(err, proposaldao.ErrNotFound) {
		writeError(w, http.StatusNotFound, "proposal not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load proposal")
		return
	}

	var req createProposalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	if req.UserID != "" && req.UserID != existing.UserID {
		// Authorship is immutable. Reject rather than silently
		// overwriting so the UI surfaces the mismatch.
		writeError(w, http.StatusForbidden, "user_id cannot change")
		return
	}

	existing.UserName = req.UserName
	existing.IsDraft = req.IsDraft || !req.IsSubmitted
	existing.IsSubmitted = req.IsSubmitted
	existing.SubmissionTxHash = req.SubmissionTxHash
	existing.SubmissionDate = req.SubmissionDate
	existing.Name = req.Name
	existing.Abstract = req.Abstract
	existing.Motivation = req.Motivation
	existing.Rationale = req.Rationale
	existing.GovActionType = req.GovActionType
	existing.Withdrawals = req.Withdrawals
	existing.HardForkContent = req.HardForkContent
	existing.ConstitutionContent = req.ConstitutionContent
	existing.Links = req.Links
	existing.RequestedBudget = req.RequestedBudget
	existing.AnchorHash = req.AnchorHash

	if err := h.proposals.Update(r.Context(), &existing); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update proposal")
		return
	}
	writeJSON(w, http.StatusOK, singleResponse[proposalEnvelope]{Data: toEnvelope(existing)})
}

// deleteProposal implements DELETE /proposals/{id}.
func (h *handlerDeps) deleteProposal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}
	if err := h.proposals.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete proposal")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// listOnchainForProposal implements GET /proposals/{id}/onchain-docs.
// We thread by either the proposal's anchor_hash or its
// submission_tx_hash, depending on which the indexed docs reference.
func (h *handlerDeps) listOnchainForProposal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.proposals.Get(r.Context(), id)
	if errors.Is(err, proposaldao.ErrNotFound) {
		writeError(w, http.StatusNotFound, "proposal not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load proposal")
		return
	}

	keys := proposalSubjectKeys(p)
	seen := map[string]bool{}
	var combined []any
	for _, key := range keys {
		docs, err := h.onchain.ListBySubject(r.Context(), key)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load on-chain docs")
			return
		}
		for _, d := range docs {
			if seen[d.AnchorRef] {
				continue
			}
			seen[d.AnchorRef] = true
			combined = append(combined, d)
		}
	}
	writeJSON(w, http.StatusOK, paginatedResponse[any]{
		Data: combined,
		Meta: paginationMeta{Pagination: paginationInfo{Total: len(combined)}},
	})
}

// listOnchainDocs implements GET /onchain-docs?type=...&subject=...
// Mostly useful for debugging the indexer and surfacing standalone
// DraftProposal documents that have no `subject`.
func (h *handlerDeps) listOnchainDocs(w http.ResponseWriter, r *http.Request) {
	docType := r.URL.Query().Get("type")
	subject := r.URL.Query().Get("subject")
	var (
		rows []any
		err  error
	)
	switch {
	case subject != "":
		docs, e := h.onchain.ListBySubject(r.Context(), subject)
		err = e
		for _, d := range docs {
			rows = append(rows, d)
		}
	case docType != "":
		docs, e := h.onchain.ListByType(r.Context(), docType)
		err = e
		for _, d := range docs {
			rows = append(rows, d)
		}
	default:
		writeError(w, http.StatusBadRequest, "type or subject query param required")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list on-chain docs")
		return
	}
	writeJSON(w, http.StatusOK, paginatedResponse[any]{
		Data: rows,
		Meta: paginationMeta{Pagination: paginationInfo{Total: len(rows)}},
	})
}

// getOnchainDoc implements GET /onchain-docs/{anchorRef}.
func (h *handlerDeps) getOnchainDoc(w http.ResponseWriter, r *http.Request) {
	ref := chi.URLParam(r, "anchorRef")
	doc, err := h.onchain.Get(r.Context(), ref)
	if err != nil {
		writeError(w, http.StatusNotFound, "document not found")
		return
	}
	writeJSON(w, http.StatusOK, singleResponse[any]{Data: doc})
}

// proposalSubjectKeys returns the set of keys an on-chain CIP-184
// document might use to point at this proposal. We accept either
// the explicit anchor_hash the author registered or the submission
// tx hash if that's all we have.
func proposalSubjectKeys(p proposaldao.Proposal) []string {
	var keys []string
	if p.AnchorHash != "" {
		keys = append(keys, p.AnchorHash)
	}
	if p.SubmissionTxHash != "" {
		// On-chain "actionId" is typically "{tx_hash}#{cert_index}",
		// but in practice multiple action indices in one tx is rare.
		// Include both the bare tx hash and a "#0" variant so we
		// catch indexed docs published against either form.
		keys = append(keys, p.SubmissionTxHash, p.SubmissionTxHash+"#0")
	}
	return keys
}

func filterOutDrafts(rows []proposaldao.Proposal) []proposaldao.Proposal {
	out := rows[:0]
	for _, r := range rows {
		if r.IsDraft {
			continue
		}
		out = append(out, r)
	}
	return out
}

func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}
