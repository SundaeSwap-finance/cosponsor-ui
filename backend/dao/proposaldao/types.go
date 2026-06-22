// Package proposaldao stores proposals authored through the
// CoSponsor UI (drafts and submitted), prior to or independently of
// any on-chain anchor.
//
// The record layout deliberately mirrors the GovTools proposal
// pillar shape the UI used to consume, so the REST layer can hand
// records back to the frontend with minimal translation.
package proposaldao

import "time"

// Proposal is the canonical authored-proposal record. Field naming
// follows the GovTools "prop_*" / snake_case convention so JSON
// emitted by the REST layer matches what the UI is already wired
// for.
type Proposal struct {
	// Primary key: stable id assigned at create time.
	ProposalID string `dynamodbav:"proposal_id" ddb:"hash" json:"proposal_id"`

	// Authorship & ownership.
	UserID   string `dynamodbav:"user_id" ddb:"gsi_hash:ByUser" json:"user_id"`
	UserName string `dynamodbav:"user_govtool_username,omitempty" json:"user_govtool_username,omitempty"`

	// Lifecycle.
	IsDraft           bool      `dynamodbav:"is_draft" json:"is_draft"`
	IsSubmitted       bool      `dynamodbav:"prop_submitted" json:"prop_submitted"`
	SubmissionTxHash  string    `dynamodbav:"prop_submission_tx_hash,omitempty" json:"prop_submission_tx_hash,omitempty"`
	SubmissionDate    string    `dynamodbav:"prop_submission_date,omitempty" json:"prop_submission_date,omitempty"`
	PropRevisionActive bool     `dynamodbav:"prop_rev_active" json:"prop_rev_active"`
	IsLocked          *bool     `dynamodbav:"is_locked,omitempty" json:"is_locked,omitempty"`

	// Prose.
	Name      string `dynamodbav:"prop_name,omitempty" json:"prop_name,omitempty"`
	Abstract  string `dynamodbav:"prop_abstract,omitempty" json:"prop_abstract,omitempty"`
	Motivation string `dynamodbav:"prop_motivation,omitempty" json:"prop_motivation,omitempty"`
	Rationale string `dynamodbav:"prop_rationale,omitempty" json:"prop_rationale,omitempty"`

	// Action-type classification (Treasury Withdrawal / Hard Fork /
	// Info Action / etc.). Stored as a string for forward compat;
	// the UI reads it via gov_action_type.attributes.gov_action_type_name.
	GovActionType string `dynamodbav:"gov_action_type" ddb:"gsi_hash:ByActionType" json:"gov_action_type_id"`

	// Type-specific bodies. Only one is populated per proposal.
	Withdrawals          []Withdrawal       `dynamodbav:"proposal_withdrawals,omitempty" json:"proposal_withdrawals,omitempty"`
	HardForkContent      *HardForkContent   `dynamodbav:"proposal_hard_fork_content,omitempty" json:"proposal_hard_fork_content,omitempty"`
	ConstitutionContent  *ConstitutionContent `dynamodbav:"proposal_constitution_content,omitempty" json:"proposal_constitution_content,omitempty"`

	// Free-form references the author wants to surface alongside
	// the proposal.
	Links []Link `dynamodbav:"proposal_links,omitempty" json:"proposal_links,omitempty"`

	// CoSponsor-specific budget (lovelace) the author intends to
	// fund through co-sponsorship.
	RequestedBudget int64 `dynamodbav:"requested_budget,omitempty" json:"requested_budget,omitempty"`

	// CIP-100 anchor hash for the on-chain governance action, when
	// known. Lets the indexer thread feedback/addenda against this
	// proposal even if the metadata was anchored separately from
	// the action itself.
	AnchorHash string `dynamodbav:"anchor_hash,omitempty" json:"anchor_hash,omitempty"`

	// Timestamps, formatted as ISO-8601 strings to match the
	// GovTools shape directly.
	CreatedAt time.Time `dynamodbav:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `dynamodbav:"updatedAt" json:"updatedAt"`
}

// Withdrawal is one beneficiary of a treasury_withdrawals_action
// proposal. Amount is in lovelace.
type Withdrawal struct {
	ID               int64  `dynamodbav:"id,omitempty" json:"id,omitempty"`
	ReceivingAddress string `dynamodbav:"receiving_address" json:"receiving_address"`
	Amount           int64  `dynamodbav:"withdrawal_amount" json:"withdrawal_amount"`
}

// HardForkContent is the body of a hard_fork_initiation_action
// proposal.
type HardForkContent struct {
	ID    int64 `dynamodbav:"id,omitempty" json:"id,omitempty"`
	Major int   `dynamodbav:"major" json:"major"`
	Minor int   `dynamodbav:"minor" json:"minor"`
}

// ConstitutionContent is the body of a new_constitution proposal.
type ConstitutionContent struct {
	ID               int64  `dynamodbav:"id,omitempty" json:"id,omitempty"`
	ConstitutionURL  string `dynamodbav:"constitution_url" json:"constitution_url"`
	ConstitutionHash string `dynamodbav:"constitution_hash" json:"constitution_hash"`
}

// Link is one entry of Proposal.Links.
type Link struct {
	ID       int64  `dynamodbav:"id,omitempty" json:"id,omitempty"`
	PropLink string `dynamodbav:"prop_link" json:"prop_link"`
	LinkText string `dynamodbav:"prop_link_text,omitempty" json:"prop_link_text,omitempty"`
}
