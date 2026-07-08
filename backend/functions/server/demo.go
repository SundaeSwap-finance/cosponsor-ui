package main

import (
	"os"
	"strconv"
	"time"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
)

// Demo proposals are synthetic, unstored example proposals injected
// into GET /proposals so every governance-action category is always
// browsable/testable, even before any real proposal has been
// authored for it. They're named with a "[TEST]" prefix and only
// appear for categories with zero real (non-draft) proposals.
//
// Controlled by DEMO_PROPOSALS_ENABLED (resources.template), which
// defaults to enabled — toggling it is a template/redeploy change,
// not a manual Lambda console edit.
var demoCategories = []string{
	"Info Action",
	"Treasury Withdrawal",
	"Protocol Parameters",
	"Hard Fork",
	"No Confidence",
	"Constitutional Committee",
	"New Constitution",
}

// demoGenerations: every demo generation still served. The generation is
// baked into each demo ProposalID (= the derived on-chain procedure
// identity); the procedure hash is a one-shot key in the state MPF trie, so
// a submitted demo identity can never be proposed again — append a new
// generation to mint fresh ones.
//
// OLDER generations are kept (not removed) when they carry on-chain history:
// their cards must keep matching existing pools for withdrawals, which also
// means they keep the LEGACY sourceUrlId-derived anchor — toEnvelope omits
// the prop_metadata_url/hash fields for them (see demoLegacyIDs) so the
// frontend's identity derivation stays byte-compatible with what was
// pledged. Only the LAST (current) generation gets BE-served CIP-108
// metadata anchors.
var demoGenerations = []int{2, 3}

// demoLegacyIDs — ProposalIDs of all non-current demo generations.
var demoLegacyIDs = func() map[string]bool {
	legacy := make(map[string]bool)
	for _, generation := range demoGenerations[:len(demoGenerations)-1] {
		for _, category := range demoCategories {
			legacy[demoProposalID(category, generation)] = true
		}
	}
	return legacy
}()

func demoProposalID(category string, generation int) string {
	return "demo-" + slugify(category) + "-" + strconv.Itoa(generation)
}

// demoProposalByID resolves any generation's demo entry (used by the
// metadata endpoint, since demos exist only as list-time injections).
func demoProposalByID(id string) (proposaldao.Proposal, bool) {
	for _, generation := range demoGenerations {
		for _, category := range demoCategories {
			if demoProposalID(category, generation) == id {
				return buildDemoProposal(category, generation), true
			}
		}
	}
	return proposaldao.Proposal{}, false
}

func demoProposalsEnabled() bool {
	raw := os.Getenv("DEMO_PROPOSALS_ENABLED")
	if raw == "" {
		return true
	}
	enabled, err := strconv.ParseBool(raw)
	if err != nil {
		return true
	}
	return enabled
}

// buildDemoProposal synthesizes a category's example proposal.
// ProposalID (and therefore the derived envelope id and on-chain
// identity hash) is deterministic per category so the same demo
// proposal resolves consistently across requests.
func buildDemoProposal(category string, generation int) proposaldao.Proposal {
	p := proposaldao.Proposal{
		ProposalID:    demoProposalID(category, generation),
		Name:          "[TEST] Sample " + category + " Proposal #" + strconv.Itoa(generation),
		Abstract:      "This is a demo " + category + " proposal for testing the CoSponsor platform. It has a future expiry date so you can test sponsoring and withdrawing.",
		Motivation:    "This demo proposal demonstrates the CoSponsor platform functionality. Use it to test depositing and withdrawing ADA.",
		Rationale:     "Testing is essential to ensure the platform works correctly before mainnet launch.",
		GovActionType: category,
		IsDraft:       false,
		IsSubmitted:   false,
		UserID:        "demo",
		UserName:      "Demo",
		// Backdated so the frontend's +90 day expiry window lands
		// ~30 days out, matching the old client-side mock's window.
		CreatedAt: time.Now().UTC().Add(-60 * 24 * time.Hour),
		UpdatedAt: time.Now().UTC(),
	}

	switch category {
	case "Treasury Withdrawal":
		p.Withdrawals = []proposaldao.Withdrawal{{
			// Preview testnet enterprise address.
			ReceivingAddress: "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp",
			Amount:           50000000000, // 50,000 ADA in lovelace
		}}
	case "Hard Fork":
		p.HardForkContent = &proposaldao.HardForkContent{Major: 10, Minor: 0}
	case "New Constitution":
		p.ConstitutionContent = &proposaldao.ConstitutionContent{
			ConstitutionURL:  "https://constitution.gov.cardano.org/test-constitution.json",
			ConstitutionHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
		}
	}

	// Generation-2 Info Action was submitted on-chain via the browser E2E
	// (2026-07-08) — reflect that so the UI doesn't offer re-pledging into a
	// consumed (unproposable) identity.
	if category == "Info Action" && generation == 2 {
		p.IsSubmitted = true
		p.SubmissionTxHash = "3b457abc9238a5ff47bcd57b1f4dc8a234cc5205338b7707b9a192b8897c2edb"
	}

	return p
}

func slugify(category string) string {
	out := make([]byte, 0, len(category))
	for _, r := range category {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			out = append(out, byte(r))
		case r >= 'A' && r <= 'Z':
			out = append(out, byte(r+32))
		case r == ' ':
			out = append(out, '-')
		}
	}
	return string(out)
}
