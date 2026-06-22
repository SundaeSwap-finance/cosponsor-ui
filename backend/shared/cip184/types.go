// Package cip184 defines the JSON-LD document shapes from
// CIP-184 (Governance Proposal Feedback and Addenda).
//
// All three top-level types — DraftProposal, ProposalFeedback,
// ProposalAddendum — share the CIP-100 envelope (hashAlgorithm,
// authors, body), so the envelope is modelled once in Document and
// the body is decoded lazily into one of the typed bodies based on
// the document's `@type` field.
package cip184

import (
	"encoding/json"
	"fmt"
)

const (
	TypeDraftProposal    = "DraftProposal"
	TypeProposalFeedback = "ProposalFeedback"
	TypeProposalAddendum = "ProposalAddendum"

	// MetadataLabel1694 is the CIP-100 anchor label that CIP-184
	// documents are published under.
	MetadataLabel1694 = uint64(1694)
)

// Document is the CIP-100 envelope shared by every CIP-184 doc.
type Document struct {
	Context       json.RawMessage `json:"@context,omitempty"`
	Type          string          `json:"@type"`
	HashAlgorithm string          `json:"hashAlgorithm,omitempty"`
	Authors       []Author        `json:"authors,omitempty"`
	Body          json.RawMessage `json:"body"`
}

// Author models the CIP-100 author + witness shape.
type Author struct {
	Name    string          `json:"name,omitempty"`
	Witness json.RawMessage `json:"witness,omitempty"`
}

// Subject is the cross-document reference shape used by both
// ProposalFeedback and ProposalAddendum to identify the proposal
// they pertain to.
type Subject struct {
	Type     string `json:"@type"`
	URI      string `json:"uri,omitempty"`
	Hash     string `json:"hash,omitempty"`
	ActionID string `json:"actionId,omitempty"`
	Label    string `json:"label,omitempty"`
}

// DraftBody is the body of a DraftProposal document.
type DraftBody struct {
	Content            string  `json:"content"`
	ProposedActionType string  `json:"proposedActionType"`
	Revision           int     `json:"revision"`
	Status             string  `json:"status"`
	Supersedes         string   `json:"supersedes,omitempty"`
	SubmittedAs        *Subject `json:"submittedAs,omitempty"`
}

// FeedbackBody is the body of a ProposalFeedback document.
type FeedbackBody struct {
	Subject      Subject       `json:"subject"`
	FeedbackType string        `json:"feedbackType"`
	Content      json.RawMessage `json:"content"`
	Conditions   []Condition   `json:"conditions,omitempty"`
	InReplyTo    []string      `json:"inReplyTo,omitempty"`
	VotingIntent *VotingIntent `json:"votingIntent,omitempty"`
}

// Condition is one entry of FeedbackBody.Conditions.
type Condition struct {
	Description string `json:"description"`
	Criticality string `json:"criticality"`
	AddressedBy string `json:"addressedBy,omitempty"`
}

// VotingIntent describes the author's intended ballot.
// Tooling MUST NOT treat this as the actual vote — see CIP-184.
type VotingIntent struct {
	Role       string `json:"role,omitempty"`
	Identifier string `json:"identifier,omitempty"`
	Stance     string `json:"stance,omitempty"`
}

// AddendumBody is the body of a ProposalAddendum document.
type AddendumBody struct {
	Subject           Subject            `json:"subject"`
	AddendumType      string             `json:"addendumType"`
	Content           string             `json:"content"`
	BindingStatements []BindingStatement `json:"bindingStatements,omitempty"`
	Addresses         []AddressEntry     `json:"addresses,omitempty"`
	InReplyTo         []string           `json:"inReplyTo,omitempty"`
	Supersedes        []string           `json:"supersedes,omitempty"`
}

// BindingStatement is one entry of AddendumBody.BindingStatements.
type BindingStatement struct {
	Field        string `json:"field"`
	OriginalText string `json:"originalText,omitempty"`
	RevisedText  string `json:"revisedText"`
	Rationale    string `json:"rationale,omitempty"`
}

// AddressEntry is one entry of AddendumBody.Addresses (the
// structured author-disposition response to a piece of feedback).
type AddressEntry struct {
	URI         string `json:"uri"`
	Disposition string `json:"disposition"`
}

// ParsedBody decodes Body into the type implied by the envelope's
// @type. Returns (nil, nil) for unrecognized @types — callers may
// still want to store the raw document.
func (d *Document) ParsedBody() (any, error) {
	switch d.Type {
	case TypeDraftProposal:
		var b DraftBody
		if err := json.Unmarshal(d.Body, &b); err != nil {
			return nil, fmt.Errorf("decode DraftProposal body: %w", err)
		}
		return &b, nil
	case TypeProposalFeedback:
		var b FeedbackBody
		if err := json.Unmarshal(d.Body, &b); err != nil {
			return nil, fmt.Errorf("decode ProposalFeedback body: %w", err)
		}
		return &b, nil
	case TypeProposalAddendum:
		var b AddendumBody
		if err := json.Unmarshal(d.Body, &b); err != nil {
			return nil, fmt.Errorf("decode ProposalAddendum body: %w", err)
		}
		return &b, nil
	default:
		return nil, nil
	}
}
