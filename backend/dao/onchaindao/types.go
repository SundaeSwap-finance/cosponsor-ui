// Package onchaindao stores the CIP-184 documents the indexer
// discovers under CIP-100 metadata label 1694.
//
// The DAO holds raw documents keyed by where they were anchored on
// chain (tx_hash + metadata label) and exposes a `BySubject` GSI
// so feedback and addenda can be efficiently threaded under the
// proposal they reference.
package onchaindao

import "time"

// AnchoredDocument is one CIP-184 doc we observed on chain.
type AnchoredDocument struct {
	// AnchorRef is the primary key: "{tx_hash}#{metadata_label}".
	// Using the tx+label pair makes the key naturally unique and
	// lets a single transaction anchor multiple labels (e.g. 1694
	// plus a project-specific label) without colliding.
	AnchorRef string `dynamodbav:"anchor_ref" ddb:"hash" json:"anchor_ref"`

	// TxHash is the on-chain transaction that anchored this doc.
	TxHash string `dynamodbav:"tx_hash" json:"tx_hash"`

	// Slot at which the anchoring transaction was applied.
	Slot uint64 `dynamodbav:"slot" json:"slot"`

	// Type is the CIP-184 @type: DraftProposal, ProposalFeedback,
	// ProposalAddendum, or another CIP-100 document that happens
	// to use one of CIP-184's vocabulary fields. Cached at index
	// time so the API can filter without re-decoding the body.
	DocType string `dynamodbav:"doc_type,omitempty" ddb:"gsi_hash:ByDocType" json:"doc_type,omitempty"`

	// SubjectKey is the value of body.subject.actionId (or .uri)
	// flattened into a single string the BySubject GSI keys on.
	// Empty for DraftProposal documents, which have no subject.
	SubjectKey string `dynamodbav:"subject_key,omitempty" ddb:"gsi_hash:BySubject" json:"subject_key,omitempty"`

	// SubjectType is the @type of the subject reference
	// (GovernanceAction / GovernanceMetadata / DraftProposal),
	// cached at index time to avoid re-parsing.
	SubjectType string `dynamodbav:"subject_type,omitempty" json:"subject_type,omitempty"`

	// RawDocument is the unparsed JSON of the CIP-184 document as
	// it appeared in the on-chain metadata (or was fetched from
	// the referenced URI). Stored verbatim so witness verification
	// downstream is reproducible.
	RawDocument string `dynamodbav:"raw_document" json:"raw_document"`

	// External marks documents we resolved through a uri+hash
	// reference rather than inlined metadata. Useful for debugging
	// when a referenced doc disappears from its host.
	External bool `dynamodbav:"external,omitempty" json:"external,omitempty"`

	// IndexedAt is the wall-clock time the indexer wrote the row.
	IndexedAt time.Time `dynamodbav:"indexed_at" json:"indexed_at"`
}
