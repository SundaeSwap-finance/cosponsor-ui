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

// demoGeneration is baked into every demo ProposalID (= the anchor's
// sourceUrlId = the derived on-chain procedure identity). Increment it
// whenever a demo pool has been consumed by a test submission — the
// procedure hash is a one-shot key in the state MPF trie, so a submitted
// demo identity can never be proposed again; a bump mints fresh ones.
const demoGeneration = 2

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
func buildDemoProposal(category string) proposaldao.Proposal {
	p := proposaldao.Proposal{
		ProposalID:    "demo-" + slugify(category) + "-" + strconv.Itoa(demoGeneration),
		Name:          "[TEST] Sample " + category + " Proposal #" + strconv.Itoa(demoGeneration),
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
