package main

import (
	"time"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
)

// The types in this file wrap proposaldao.Proposal in the
// GovTools "Proposal Pillar" response shape that the cosponsor-ui
// frontend already consumes — see src/types/GovToolsApi.ts:
//
//   { data: [...], meta: { pagination: { start, limit, total } } }
//
// where each item is { id, attributes: { ..., content: { id, attributes: {...} } } }.
//
// Modelling the wrapper here (rather than re-shaping in the UI)
// keeps the UI migration to "swap the base URL" in
// src/api/govToolsApi.tsx.

// paginatedResponse is the list-endpoint wrapper.
type paginatedResponse[T any] struct {
	Data []T            `json:"data"`
	Meta paginationMeta `json:"meta"`
}

type paginationMeta struct {
	Pagination paginationInfo `json:"pagination"`
}

type paginationInfo struct {
	Start int `json:"start"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}

// singleResponse is the get-one wrapper.
type singleResponse[T any] struct {
	Data T `json:"data"`
}

// proposalEnvelope is the outer record (corresponds to
// IGovToolsProposal in the frontend).
type proposalEnvelope struct {
	ID         int64              `json:"id"`
	Attributes proposalAttributes `json:"attributes"`
}

type proposalAttributes struct {
	PropLikes           int             `json:"prop_likes"`
	PropDislikes        int             `json:"prop_dislikes"`
	PropCommentsNumber  int             `json:"prop_comments_number"`
	UserID              string          `json:"user_id"`
	CreatedAt           string          `json:"createdAt"`
	UpdatedAt           string          `json:"updatedAt"`
	UserGovtoolUsername string          `json:"user_govtool_username"`
	Content             proposalContent `json:"content"`
}

type proposalContent struct {
	ID         int64                     `json:"id"`
	Attributes proposalContentAttributes `json:"attributes"`
}

type proposalContentAttributes struct {
	ProposalID                  string                       `json:"proposal_id"`
	PropRevActive               bool                         `json:"prop_rev_active"`
	PropAbstract                string                       `json:"prop_abstract"`
	PropMotivation              string                       `json:"prop_motivation"`
	PropRationale               string                       `json:"prop_rationale"`
	GovActionTypeID             string                       `json:"gov_action_type_id"`
	PropName                    string                       `json:"prop_name"`
	IsDraft                     bool                         `json:"is_draft"`
	UserID                      string                       `json:"user_id"`
	PropSubmitted               bool                         `json:"prop_submitted"`
	PropSubmissionTxHash        *string                      `json:"prop_submission_tx_hash"`
	PropSubmissionDate          *string                      `json:"prop_submission_date"`
	CreatedAt                   string                       `json:"createdAt"`
	UpdatedAt                   string                       `json:"updatedAt"`
	IsLocked                    *bool                        `json:"is_locked"`
	ProposalLinks               []proposaldao.Link           `json:"proposal_links"`
	ProposalWithdrawals         []proposaldao.Withdrawal     `json:"proposal_withdrawals"`
	ProposalConstitutionContent *proposaldao.ConstitutionContent `json:"proposal_constitution_content"`
	ProposalHardForkContent     *proposaldao.HardForkContent `json:"proposal_hard_fork_content"`
	GovActionType               govActionType                `json:"gov_action_type"`
}

type govActionType struct {
	ID         int64                   `json:"id"`
	Attributes govActionTypeAttributes `json:"attributes"`
}

type govActionTypeAttributes struct {
	GovActionTypeName string `json:"gov_action_type_name"`
	CreatedAt         string `json:"createdAt"`
	UpdatedAt         string `json:"updatedAt"`
	PublishedAt       string `json:"publishedAt"`
}

// toEnvelope wraps a proposaldao.Proposal in the GovTools-shaped
// response envelope.
//
// The numeric `id` field the frontend expects is synthesized via a
// stable string-id hash (FNV) so the same proposal always gets the
// same numeric handle within a frontend session. The real identity
// is the uuid in proposal_id.
func toEnvelope(p proposaldao.Proposal) proposalEnvelope {
	createdAt := p.CreatedAt.UTC().Format(time.RFC3339Nano)
	updatedAt := p.UpdatedAt.UTC().Format(time.RFC3339Nano)

	var txHash *string
	if p.SubmissionTxHash != "" {
		txHash = &p.SubmissionTxHash
	}
	var submitDate *string
	if p.SubmissionDate != "" {
		submitDate = &p.SubmissionDate
	}

	numericID := fnv64(p.ProposalID)

	return proposalEnvelope{
		ID: numericID,
		Attributes: proposalAttributes{
			PropLikes:           0,
			PropDislikes:        0,
			PropCommentsNumber:  0,
			UserID:              p.UserID,
			CreatedAt:           createdAt,
			UpdatedAt:           updatedAt,
			UserGovtoolUsername: p.UserName,
			Content: proposalContent{
				ID: numericID,
				Attributes: proposalContentAttributes{
					ProposalID:                  p.ProposalID,
					PropRevActive:               p.PropRevisionActive,
					PropAbstract:                p.Abstract,
					PropMotivation:              p.Motivation,
					PropRationale:               p.Rationale,
					GovActionTypeID:             p.GovActionType,
					PropName:                    p.Name,
					IsDraft:                     p.IsDraft,
					UserID:                      p.UserID,
					PropSubmitted:               p.IsSubmitted,
					PropSubmissionTxHash:        txHash,
					PropSubmissionDate:          submitDate,
					CreatedAt:                   createdAt,
					UpdatedAt:                   updatedAt,
					IsLocked:                    p.IsLocked,
					ProposalLinks:               p.Links,
					ProposalWithdrawals:         p.Withdrawals,
					ProposalConstitutionContent: p.ConstitutionContent,
					ProposalHardForkContent:     p.HardForkContent,
					GovActionType: govActionType{
						ID: fnv64(p.GovActionType),
						Attributes: govActionTypeAttributes{
							GovActionTypeName: p.GovActionType,
							CreatedAt:         createdAt,
							UpdatedAt:         updatedAt,
							PublishedAt:       createdAt,
						},
					},
				},
			},
		},
	}
}

// fnv64 is the FNV-1a 64-bit hash, truncated to int63 so the value
// fits in the `number` type the JS UI expects.
func fnv64(s string) int64 {
	const (
		offset64 = 1469598103934665603
		prime64  = 1099511628211
	)
	var h uint64 = offset64
	for i := 0; i < len(s); i++ {
		h ^= uint64(s[i])
		h *= prime64
	}
	return int64(h >> 1)
}
