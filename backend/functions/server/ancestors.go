package main

import (
	"encoding/json"
	"net/http"
	"os"
	"sync"
	"time"
)

// GET /ancestors — the per-purpose "previous governance action id" the
// Conway ledger requires on state-threading proposals (NoConfidence,
// ConstitutionalCommittee, ...). The frontend cannot query Koios directly
// (koios.rest sends no CORS headers), so this endpoint proxies the lookup
// server-side and caches it: the value only changes when a governance
// action of that purpose is ENACTED, i.e. at most once per epoch.
//
// Response shape (keys match the SDK's TAncestorPurpose):
//
//	{"Committee":{"txHash":"…","index":0},"Constitution":null,
//	 "PParamUpdate":{…},"HardFork":{…}}
//
// null = purpose never enacted (the only case the ledger accepts a null
// ancestor).

// koiosProposal mirrors the fields selected from Koios /proposal_list.
type koiosProposal struct {
	ProposalTxHash string `json:"proposal_tx_hash"`
	ProposalIndex  int    `json:"proposal_index"`
	ProposalType   string `json:"proposal_type"`
	EnactedEpoch   *int   `json:"enacted_epoch"`
}

type ancestorRef struct {
	TxHash string `json:"txHash"`
	Index  int    `json:"index"`
}

// Koios proposal_type values belonging to each ledger purpose.
var ancestorPurposeTypes = map[string][]string{
	"Committee":    {"NewCommittee", "NoConfidence"},
	"Constitution": {"NewConstitution"},
	"PParamUpdate": {"ParameterChange"},
	"HardFork":     {"HardForkInitiation"},
}

const ancestorsCacheTTL = time.Hour

var ancestorsCache struct {
	sync.Mutex
	fetchedAt time.Time
	payload   map[string]*ancestorRef
}

func koiosBaseURL() string {
	if v := os.Getenv("KOIOS_BASE_URL"); v != "" {
		return v
	}
	return "https://preview.koios.rest/api/v1"
}

func (h *handlerDeps) getAncestors(w http.ResponseWriter, _ *http.Request) {
	ancestorsCache.Lock()
	defer ancestorsCache.Unlock()

	if ancestorsCache.payload != nil && time.Since(ancestorsCache.fetchedAt) < ancestorsCacheTTL {
		writeJSON(w, http.StatusOK, ancestorsCache.payload)
		return
	}

	url := koiosBaseURL() +
		"/proposal_list?select=proposal_tx_hash,proposal_index,proposal_type,enacted_epoch&enacted_epoch=not.is.null"
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		writeError(w, http.StatusBadGateway, "governance-state lookup failed")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		writeError(w, http.StatusBadGateway, "governance-state lookup failed")
		return
	}

	var proposals []koiosProposal
	if err := json.NewDecoder(resp.Body).Decode(&proposals); err != nil {
		writeError(w, http.StatusBadGateway, "governance-state lookup returned malformed data")
		return
	}

	payload := make(map[string]*ancestorRef, len(ancestorPurposeTypes))
	for purpose, types := range ancestorPurposeTypes {
		var best *koiosProposal
		for i := range proposals {
			p := &proposals[i]
			if p.EnactedEpoch == nil {
				continue
			}
			matched := false
			for _, t := range types {
				if p.ProposalType == t {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
			if best == nil || *p.EnactedEpoch > *best.EnactedEpoch {
				best = p
			}
		}
		if best != nil {
			payload[purpose] = &ancestorRef{TxHash: best.ProposalTxHash, Index: best.ProposalIndex}
		} else {
			payload[purpose] = nil
		}
	}

	ancestorsCache.payload = payload
	ancestorsCache.fetchedAt = time.Now()
	writeJSON(w, http.StatusOK, payload)
}
