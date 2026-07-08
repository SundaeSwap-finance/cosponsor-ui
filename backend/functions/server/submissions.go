package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/SundaeSwap-finance/cosponsor-ui/backend/dao/proposaldao"
)

// On-chain submission detection: every governance action carries the anchor
// (meta_url + meta_hash) that was hashed into its cosponsored procedure, and
// both anchor conventions this system mints are derivable server-side:
//
//   - BE metadata anchor:  {API_PUBLIC_BASE_URL}/proposals/{id}/metadata.jsonld
//     with meta_hash = blake2b-256 of the served document (metadata.go)
//   - legacy SPA anchor:   {APP_PUBLIC_BASE_URL}/proposal/{fnv64(id)}
//     with meta_hash = the numeric id right-padded with '0' to 64 chars
//     (the frontend's pre-metadata pseudo-hash convention)
//
// So "was this proposal submitted?" is a lookup of its candidate anchors in
// Koios /proposal_list — no persisted flag or indexer required. toEnvelope
// overlays the result at serve time; a manually stored IsSubmitted (demo
// hardcode, future creator flow) still wins and doubles as the fallback when
// Koios is unreachable.

type koiosSubmittedAction struct {
	ProposalTxHash string  `json:"proposal_tx_hash"`
	MetaURL        *string `json:"meta_url"`
	MetaHash       *string `json:"meta_hash"`
}

type submissionRef struct {
	TxHash   string
	MetaHash string
}

const submissionsCacheTTL = 5 * time.Minute

var submissionsCache struct {
	sync.Mutex
	fetchedAt   time.Time
	lastAttempt time.Time
	byMetaURL   map[string]submissionRef
}

// submissionsRetryBackoff bounds how often a failing Koios is retried —
// without it every /proposals request would pay the full client timeout
// during an outage.
const submissionsRetryBackoff = 30 * time.Second

// appPublicBaseURL is the frontend origin the legacy anchor URLs were built
// from at pledge time (config.appBaseUrl in the UI).
func appPublicBaseURL() string {
	if v := os.Getenv("APP_PUBLIC_BASE_URL"); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://cosponsor.preview.sundae.fi"
}

// submissionsByMetaURL returns meta_url → submission ref for every on-chain
// governance action, cached. Degrades gracefully: on Koios failure the stale
// cache (if any) keeps being served, otherwise nil — list serving must never
// depend on Koios availability.
func submissionsByMetaURL() map[string]submissionRef {
	submissionsCache.Lock()
	defer submissionsCache.Unlock()

	if submissionsCache.byMetaURL != nil && time.Since(submissionsCache.fetchedAt) < submissionsCacheTTL {
		return submissionsCache.byMetaURL
	}
	if time.Since(submissionsCache.lastAttempt) < submissionsRetryBackoff {
		return submissionsCache.byMetaURL
	}
	submissionsCache.lastAttempt = time.Now()

	// Short timeout: this runs inline in /proposals serving (once per cache
	// window) — a Koios stall must degrade to "status unknown", not hang the
	// listing.
	url := koiosBaseURL() + "/proposal_list?select=proposal_tx_hash,meta_url,meta_hash"
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return submissionsCache.byMetaURL
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return submissionsCache.byMetaURL
	}

	var actions []koiosSubmittedAction
	if err := json.NewDecoder(resp.Body).Decode(&actions); err != nil {
		return submissionsCache.byMetaURL
	}

	m := make(map[string]submissionRef, len(actions))
	for _, a := range actions {
		if a.MetaURL == nil || *a.MetaURL == "" {
			continue
		}
		hash := ""
		if a.MetaHash != nil {
			hash = strings.ToLower(*a.MetaHash)
		}
		// First hit wins; Koios orders newest-first and a procedure hash is
		// a one-shot key, so duplicates would be distinct actions reusing an
		// anchor — the hash check below disambiguates.
		if _, exists := m[*a.MetaURL]; !exists {
			m[*a.MetaURL] = submissionRef{TxHash: a.ProposalTxHash, MetaHash: hash}
		}
	}

	submissionsCache.byMetaURL = m
	submissionsCache.fetchedAt = time.Now()
	return m
}

// legacyPseudoHash mirrors the frontend's pre-metadata anchor hash:
// String(fnv64(id)) right-padded with '0' to 64 hex chars.
func legacyPseudoHash(numericID string) string {
	if len(numericID) >= 64 {
		return numericID[:64]
	}
	return numericID + strings.Repeat("0", 64-len(numericID))
}

// overlaySubmission fills IsSubmitted/SubmissionTxHash from chain data when
// the stored record doesn't already say so. Anchor hash must match too —
// URL alone could be spoofed by an unrelated action citing our URL.
func overlaySubmission(p *proposaldao.Proposal) {
	if p.IsSubmitted {
		return
	}
	subs := submissionsByMetaURL()
	if len(subs) == 0 {
		return
	}

	// The frontend builds sourceUrlId as String(envelope.id) — a JSON number
	// parsed into a float64, so ids above 2^53 lose their low digits BEFORE
	// being baked into the on-chain anchor (verified against the live action:
	// fnv64 2855862108785783343 → on-chain URL id 2855862108785783300).
	// Mirror that rounding: shortest round-trip float formatting matches JS
	// Number→String for all values below 1e21.
	numericID := strconv.FormatFloat(float64(fnv64(p.ProposalID)), 'f', -1, 64)
	type candidate struct{ url, hash string }
	candidates := []candidate{
		{url: appPublicBaseURL() + "/proposal/" + numericID, hash: legacyPseudoHash(numericID)},
	}
	if !demoLegacyIDs[p.ProposalID] {
		if _, hash, err := buildProposalMetadata(*p); err == nil {
			candidates = append(candidates, candidate{url: metadataURLFor(p.ProposalID), hash: hash})
		}
	}

	for _, c := range candidates {
		if ref, ok := subs[c.url]; ok && ref.MetaHash == c.hash {
			p.IsSubmitted = true
			p.SubmissionTxHash = ref.TxHash
			return
		}
	}
}
