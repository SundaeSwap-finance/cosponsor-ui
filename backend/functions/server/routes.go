package main

import (
	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/onchaindao"
	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
	"github.com/go-chi/chi/v5"
)

// handlerDeps bundles the DAOs the HTTP handlers need so each
// handler signature stays focused on (w, r).
type handlerDeps struct {
	proposals *proposaldao.DAO
	onchain   *onchaindao.DAO
}

// mountRoutes wires the cosponsor REST surface onto an existing
// chi router. The shape is deliberately a near-clone of the GovTools
// Proposal Pillar API the UI was already wired against — see
// src/api/govToolsProposals.ts in the frontend.
func mountRoutes(r chi.Router, deps *handlerDeps) {
	r.Get("/health", deps.health)

	// Mirror of the GovTools "Proposal" routes the UI consumes.
	r.Get("/proposals", deps.listProposals)
	r.Post("/proposals", deps.createProposal)
	r.Get("/proposals/{id}", deps.getProposal)
	r.Put("/proposals/{id}", deps.updateProposal)
	r.Delete("/proposals/{id}", deps.deleteProposal)

	// Per-purpose prev-gov-action-ids (Koios proxied server-side —
	// koios.rest has no CORS headers for browser callers).
	r.Get("/ancestors", deps.getAncestors)

	// On-chain CIP-184 feedback / addenda indexed by metadata
	// label 1694 and surfaced threaded under a proposal.
	r.Get("/proposals/{id}/onchain-docs", deps.listOnchainForProposal)
	r.Get("/onchain-docs", deps.listOnchainDocs)
	r.Get("/onchain-docs/{anchorRef}", deps.getOnchainDoc)
}
