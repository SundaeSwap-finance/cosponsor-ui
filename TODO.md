# Cosponsor UI - TODO & Issues

Last updated: 2026-07-01

---

## ✅ Completed: Migrate off GovTools to in-house cosponsor-api (2026-07-01)

The UI no longer depends on the external GovTools Proposal Pillar API. All
proposal reads now go through the in-house `cosponsor-api` Go backend
(`backend/`, deployed at `api.cosponsor.preview.sundae.fi` /
`api.cosponsor.sundae.fi`), whose response envelope mirrors the old GovTools
shape so the frontend transform logic didn't need to change.

- `src/api/govToolsApi.tsx` → `src/api/cosponsorApi.ts` (new base URLs)
- `src/api/govToolsProposals.ts` → `src/api/proposalsApi.ts`
- `src/types/GovToolsApi.ts` → `src/types/ProposalApi.ts`
- Removed the `govtools-proposals-backup.json` static fallback, the
  `DataSourceBanner`, and `src/lib/dataSourceStatus.ts` — no longer needed
  now that we control backend uptime. The per-category mock proposal
  injection (`MOCK_CATEGORIES` in `proposalsApi.ts`) is intentionally kept
  so every category always has a browsable example.
- `requestedBudget` / `pledgedAmount` / `userPledged` / `pledges` are still
  sourced from on-chain data, not from cosponsor-api yet — the backend's
  `POST/PUT/DELETE /proposals` endpoints exist but aren't wired to the UI.

### Now unblocked by the cosponsor-api backend

These TODOs were written when there was no in-house backend to move work to.
That's no longer true — worth scoping as real follow-up work:

- [ ] **`src/lib/cardano/proposalTotals.ts:17`** — `TODO(BE): move this
      aggregation to Pi's backend indexer once it's live`. `backend/dao/
      onchaindao/` (the CIP-184 indexer) exists now; move deposit/pledge
      aggregation server-side instead of scanning script UTxOs client-side
      on every page load.
- [ ] **`src/components/proposals/filters/FilterPropCreator.tsx:17`** —
      creator/dRep filter still uses hardcoded test user data
      (`tempUserList`). `proposaldao.Proposal` already has a `UserID` field,
      so a creator-lookup endpoint may be closer to feasible than it looked
      pre-migration.

---

## Design decision: transaction collateral is pure ADA (2026-06-22)

Agreed with Pi + Mark. Tx collateral must be ADA-only. Collateral is consumed
only on a phase-2 (script) validation failure; we set a collateral-return
address as a safety net (the ledger then returns surplus ADA **and all tokens**
to the user even if collateral is consumed — tokens are never lost), and prefer
pinning a pure-ADA wallet UTxO so tokens never sit on collateral in the first
place. Implemented in `src/lib/cardano/collateral.ts` (`applyPureAdaCollateral`),
called before `complete()` in ModalSponsor/ModalWithdraw. Fixes Ogmios error
3133 ("collateral carries something else than Ada tokens").

UTxO freshness (the related #2): no change needed — deposit/withdraw already
rebuild fresh on click (fresh `createConfiguredBlaze` + fresh
`fetchWithdrawalPlan`), and the SDK wallet wrapper re-reads `getUtxos` per build
and excludes pending-spent inputs via `pendingUtxoTracker`. The `3997`
("all inputs spent") seen 2026-06-22 was most likely the soak-harness spending
the same script UTxOs concurrently (shared-wallet race), not a stale cache.

---

## ✅ Resolved: Deposit Matching Bug

**Status:** FIXED
**Root Cause:** The matching logic tried to recalculate token hash from datum, which didn't work due to data type mismatches (string vs bigint) and wasn't necessary.

**Solution:**
The on-chain validator groups ALL non-expired UTxOs under the same key (`#""`). This means:
- We don't need to match specific UTxOs to specific token types
- We can use a **biggest-first UTxO selection** strategy
- Burn any gADA tokens, spend any script UTxOs, as long as totals balance

**Files Changed:**
- `src/lib/cardano/fetchUserDeposits.ts` - New `fetchWithdrawalPlan()` function
- `src/lib/cosponsor-sdk/transactions/BrowserWithdrawal.ts` - New biggest-first approach

---

## ✅ Completed (Milestone 1)

- [x] Browser deposits working on-chain
- [x] Withdrawal transaction builder (refactored with biggest-first UTxO selection)
- [x] Withdrawal tested successfully (TX: `295489f94e23463bd20150caa1be7d66fc8a86118`)
- [x] Transaction fee previews
- [x] Wallet auto-reconnect enabled
- [x] Debug script for analyzing deposit state
- [x] Understood on-chain validator logic
- [x] Fixed display issues for on-chain proposals (no budget data)
- [x] Connected deposits to actual proposal data (was using hardcoded test data)
- [x] Replaced alert() with proper UI feedback (error/success states in modal)

---

## 📊 Debug Script

A debug script is available to analyze the state of gADA tokens and script UTxOs:

```bash
bun --env-file=.env scripts/debug-deposits.ts
```

This shows:
- All gADA tokens under the policy ID
- All UTxOs at the script address
- Any orphaned tokens (tokens without matching UTxOs)
- Balance verification

---

## 🟡 Future Milestones

### ✅ Milestone 2: Internal Refinements — Complete

All 14 prioritised action items from the internal-tester feedback are
done. See `milestones/m2-feedback.md` for the full audit trail (blockers,
functional fixes, UX improvements, code + package audits, deeper filter
integration). Post-feedback engineering work also landed:

- SDK env-var migration (`Config.ts` now configurable from `process.env`)
- SDK silent-by-default logger (`setLoggerEnabled` opt-in)
- 37 of 49 `any` types replaced across SDK library code
- SDK published to npm as `@sundaeswap/cosponsor-sdk@1.0.0-alpha.1`
- UI switched from local link to npm dependency
- Aiken token-addition guard implemented; deployment deferred to M3 (see
  `aiken/token-guard-m3` branch in cosponsor-contracts)

## 🧪 Open Feedback — Pi review 2026-05-20 (current work)

Captured from Discord thread with Pi after the deploy went live at
https://cosponsor.preview.sundae.fi/all-proposals. Not blocking M2
submission per agreement, being worked through now as M3 lead-in.

### Bugs

- [x] ~~**Number input renders a leading `0`** when typing into the
      amount field~~ — fixed in `f504580` (Strip leading zeros from
      amount input on type).
- [x] ~~**"Your Pledges" → Sponsor button sponsors the wrong proposal.**~~
      Root cause was not a key/index mix-up but a procedure-rebuild
      divergence: `ModalSponsor.buildCosponsoredProposal` rebuilt the
      cosponsoredProposal from `IProposalCardData`, which doesn't carry
      the action-specific fields (`withdrawals`, `hardForkVersion`,
      `constitutionHash`, …). The rebuilt procedure hashed differently
      from the original on-chain deposit's procedure → new gADA token
      → looked like sponsoring a different/new proposal.
      Fix is in two parts:
      - **SDK** (`cosponsor-contracts/offchain`): widened
        `IUserDeposit.cosponsoredProposal` to the fully-typed
        `ICosponsoredProposal | null` recovered from the on-chain datum
        via the new `extractCosponsoredProposalFromDatum` helper. The
        helper schema-parses the datum, converts the parsed action
        back to the typed `TGovernanceAction`, and verifies the
        round-trip by re-hashing through the manual builder — only
        returns the typed procedure when the rebuilt hash matches the
        on-chain gADA token (refuses lossy conversions instead of
        silently producing a different token). Old narrow
        `{deposit, anchor, action:{kind}}` view is preserved as
        `actionSummary` for callers that only need the kind. Covers
        all 7 governance-action variants (NicePoll, ProtocolParameters,
        NoConfidence, HardFork, TreasuryWithdrawal,
        ConstitutionalCommittee, NewConstitution).
      - **UI** (`cosponsor-ui`): thread the on-chain
        `cosponsoredProposal` through `IProposalCardData` and reuse it
        verbatim in `ModalSponsor`. Also hardened React keys in
        `ListSimpleProposals` against duplicate display ids.
- [x] ~~**Sponsor flow always creates a new proposal entry instead of
      adding to the existing one.**~~ Same root cause and same fix as
      above — once ModalSponsor reuses the on-chain procedure, the new
      deposit mints into the same gADA token and aggregates on the
      existing card. Pre-existing "old" deposits made before the Stage 1
      `deposit = govActionDeposit` fix will still appear as separate
      tokens (their original procedure hash is set in stone on-chain).
- [x] ~~**Sponsor attempt returned a Blockfrost evaluate error**
      ("script explicitly error'd" / unknown UTxOs).~~ Two failure
      families were being merged into one opaque error:
      - **Missing-UTxO family** (Ogmios inner code 3004): real
        cause is a script-ref UTxO being spent or a stale wallet UTxO
        being referenced. Already handled by `blaze-patches.ts` v6
        evaluator routing; ModalSponsor's catch surfaces a clear
        "refresh and try again" message.
      - **Script-rejection family** (outer code 3010, no missing-UTxO
        signal): the Cosponsor Aiken validator ran and returned
        `error`, almost always because the procedure data we tried to
        mint diverged from the existing token's procedure. **The
        root cause for the Sponsor flow was the Stage-2 / task #1
        procedure-rebuild bug** — reusing the on-chain procedure
        verbatim (or hashing the canonical card procedure via
        `proposalIdentity.ts` for first-time deposits) eliminates it.
      `blaze-patches.ts` now lifts the Ogmios v6 inner error reason +
      validator tag into the thrown message so future reports
      identify the family unambiguously, and `ModalSponsor.tsx`
      branches on the structured error to give the user an
      actionable message in each case.
- [ ] **Datum contains a hardcoded URL placeholder.** Pi's concern:
      "why is there a URL in the datum at all" + suspects something
      may be double-hashing. **Deferred (Mark 2026-05-27):** keep
      the `https://cosponsor.app/proposal/<sourceId>` convention for
      now — changing it churns the procedure hash for every existing
      deposit, and the right replacement (content-hash anchor +/-
      a separate identity field in the Aiken procedure) needs an
      Aiken redeploy. Revisit during M3 validator redeploy planning
      (already on the roadmap for the token-addition guard). Notes
      on the design options live in the chat log; key takeaway is
      that full round-trip works via the on-chain datum today and
      doesn't require URL changes, so this is decoupled from the
      Sponsor/Your-Pledges fixes shipped above.

### UX improvements

- [x] ~~**"Your Pledges" cards should have an inline Withdraw button.**~~
      Already in place via `CardProposal.tsx` (commit `55344920`,
      2026-05-23) — when `userPledged > 0 && !isExpired`, the card
      surfaces View Details + Withdraw + Sponsor; when
      `userPledged > 0 && isExpired`, it shows the full-width Withdraw
      Your Pledge button.
- [ ] **Group deposits per proposal in the listing.** Used to work
      (bulk-withdraw); regression. New deposits should now group
      naturally thanks to the procedure-reuse fix above (same gADA
      token → same `tokenAssetName` group). Old pre-Stage-1 deposits
      against the same proposal stay as separate cards because their
      on-chain procedure hashes genuinely differ. Cross-procedure
      aggregation in the listing requires the NewConstitution serializer
      fix in the SDK (URL-based grouping is unsafe until then).

### Open questions

- [x] ~~Are treasury withdrawals 50k ADA deposit on preview?~~ No —
      Conway's `gov_action_deposit` protocol parameter is uniform
      across all governance-action types (not per-type). On preview
      it's 100,000 ADA = 100_000_000_000 lovelace (verified
      2026-05-21, see `useGovActionDeposit.tsx`). Same value on
      mainnet. The UI already pulls this live via
      `useGovActionDeposit` / `getCachedGovActionDepositLovelace` and
      uses it as the cosponsor crowdfunding target for every
      proposal — no special-case copy needed for treasury
      withdrawals.
- [x] ~~`NicePoll` label — Mark identified this as the Info Action
      proposal-type from the GovTools mock data.~~ Mapping confirmed
      in `governanceActions.ts`: lowercase `"info action"` → action
      kind `"NicePoll"` (matches the Aiken enum). Reverse display
      mapping `NicePoll → "Info Action"` lives in
      `ACTION_TYPE_DISPLAY_NAMES`. User-facing surfaces all use
      `"Info Action"` (GovTools sets the category name; mock factory
      uses the display name). One leak fixed in `useGetProposalData`:
      on-chain deposits not matched to GovTools/mock data now
      surface the display name (`"Info Action"`) instead of the raw
      enum (`"NicePoll"`) via `ACTION_TYPE_DISPLAY_NAMES`.
- [ ] Governance-action submission flow — not part of M2 scope (Pi
      confirmed) but flagged for M3.

### Catalyst submission

- [ ] Confirm with Jenisis whether processing the above is a blocker
      for M2 submission (Mark's read: shouldn't be — feedback handling
      is "process feedback and go make improvements", not part of M2
      acceptance criteria). Awaiting answer.

### SDK bug — NewConstitution datum serialization

**Fixed.** The schema fixes landed under the SDK audit (findings F1–F6
in `cosponsor-contracts/offchain/AUDIT.md`, "FIXED & VERIFIED") and the
SDK has been rebuilt locally. The old failure mode was:

```
Failed to serialize: Invalid object at root.procedure.governanceAction.NewConstitution.constitution:
Enum variant must have a constructor index
```

That triggered Bug 2 (silent fallback to the first UTxO's anchor URL),
labelling NewConstitution deposits as some other proposal. Bug 2 is
also fixed (AUDIT F8) — unmatched / undecodable deposits now surface
with `unmatched: true` and an empty anchor instead of silently
stamping an unrelated UTxO's data.

The UI workaround (group by `tokenAssetName` instead of recovered URL
id) is left in place — it's still the correct grouping for any future
decoding failures, and the comments in `useGetProposalData.tsx`
explain why.

**Production action still needed:** the published
`@sundaeswap/cosponsor-sdk@1.0.0-alpha.1` on npm still ships the
pre-fix dist. The local UI dev picks up the rebuilt dist via the
`link:` dependency, but the deployed preview consumes the npm version
— bump and republish the SDK (e.g. `1.0.0-alpha.2`) before deploying
the preview again.

### Cosponsor proposal identity (Stage 2) — Done

`ModalSponsor.tsx` Stage 1 fix (2026-05-22): `cosponsoredProposal.deposit` now uses the gov_action_deposit (constant per network) instead of the user's pledge. Result: multiple deposits on the same proposal hash aggregate into the same on-chain token / show as one row in Your Pledges.

Stage 2 fix (2026-05-27): the URL id now matches the on-chain proposal hash. The SDK already exports `computeProposalAssetName` from the `browser` entry. The UI uses it via `src/lib/cardano/proposalIdentity.ts` (`computeProposalIdentity`): at card-construction time (mock factory + GovTools transform), build the full `cosponsoredProposal` against a stable anchor URL derived from a `sourceUrlId` (mock category id / GovTools numeric id), hash it, and use the result as `proposal.id`. `ModalSponsor` mirrors the same anchor convention (using `proposal.sourceUrlId`, not `proposal.id`) so initial-sponsor and sponsor-again-from-Your-Pledges produce byte-identical procedures.

Round-trip:
- proposal → token: `computeProposalAssetName(procedure, scriptHash)` (deterministic, one-way blake2b).
- token → proposal: read the script UTxO's datum and decode via `extractCosponsoredProposalFromDatum` (the helper added under task #1 above). The full procedure lives in the datum, so any deposited proposal can be recovered from chain.

Anchor URL convention (`https://cosponsor.app/proposal/<sourceUrlId>`) is left in place for now — discussed and deferred. Switching it is a procedure-hash change for every existing deposit, so we want to commit to a convention once and not churn.

### SDK dependency bump (`@sundaeswap/cosponsor-sdk`) — Attempted, reverted

Tried 2026-05-27: bumping `cosponsor-contracts/offchain/package.json`
to the internally-consistent Blaze 0.8.0 stack —

```jsonc
"dependencies": {
  "@blaze-cardano/core": "^0.8.0",
  "@blaze-cardano/data": "^0.6.6",
  "@blaze-cardano/sdk": "^0.2.48",
  "@blaze-cardano/uplc": "^0.4.3"
}
```

— immediately broke two things:

1. **Runtime API breakage in `@cardano-sdk/crypto`**: 8 of the 33 SDK
   tests fail with
   `TypeError: Crypto.blake2b.hash is not a function`.
   The crypto package's `blake2b` export changed shape between the
   transitive `@cardano-sdk/core@0.45.0` (pulled in by Blaze 0.7.x)
   and `@cardano-sdk/core@0.46.x` (pulled by Blaze 0.8.0). Aiken
   PlutusData hashing in the SDK relies on the call form that no
   longer exists.
2. **`tsdown` build error** in `@blaze-cardano/tx@0.14.1`'s emitted
   `.d.ts` — `__export` is not declared at
   `value-Co959D-R.d.ts:15:106`. Looks like a `tx` packaging bug
   that surfaces only when tsdown re-emits the type chain.

Net: this isn't a simple version bump. Closing it needs **either**
PRs upstream in `@blaze-cardano/tx` + `@cardano-sdk/crypto` (or a
guarded `Crypto.blake2b.hash` shim in the SDK), **or** waiting for
the next Blaze stack release that re-stabilises the surface. Until
then, the existing override stack + `blaze-patches.ts` shim continue
to work and tests are green at the 0.7.x line.

Lockfile note: `bun install` may persist the bump even after
`package.json` is reverted. If you try this, restore the lockfile
with `git checkout offchain/bun.lock` and re-run `bun install`.

Rationale (why we want this eventually) lives in the Tech Debt
section below.

---

### Milestone 3: Public Launch & Open Testing (see milestones/m3.md)
- Cosponsor validator redeploy (token-addition guard) + mainnet deployment
- Production environment setup
- Public announcement (Twitter, Pragma Discord)
- Post-launch monitoring & bug fixes

### Milestone 4: Project Completion & Stability Assessment (see milestones/m4.md)
- Final stability and performance assessment
- Comprehensive project report
- Final demo video
- Release tagged (v1.0.0)

---

## 🔧 Tech Debt: Blaze Override Stack

Patches and overrides accumulated to paper over version-skew across the
`@blaze-cardano/*` packages. They were necessary because
`@sundaeswap/cosponsor-sdk@0.0.1` pulls in `@blaze-cardano/sdk@0.2.44`,
which exact-pins `core@0.7.0`, `tx@0.13.4`, `wallet@0.4.14` — but those
packages internally call APIs that only exist in `core@0.8.x`.

### Current overrides (package.json)
| Package | Pinned to | Why |
|---|---|---|
| `@blaze-cardano/core` | 0.8.0 | Collapse 0.7.x/0.8.x dup → fixes `address.toCore is not a function` |
| `@blaze-cardano/uplc` | 0.4.3 | Force uplc subtree onto core@0.8.0 → fixes nested-version `address.toCore` |
| `@cardano-sdk/core` | 0.46.12 | Collapse 0.45.0/0.46.12 dup → fixes broken CIP-30 plumbing |

### Current runtime patches (`src/lib/cardano/blaze-patches.ts`)
| Patch | Reason | Hit on |
|---|---|---|
| `Blockfrost.evaluateTransaction` rewrite | Six upstream bugs in Blockfrost provider (see file header). Bug 6 (smart endpoint drops `?version=6` and answers v5) is still unfixed 2026-05-28 — the patch was switched to **speak v5 jsonwsp** to `/utils/txs/evaluate/utxos` so `additionalUtxoset` works and chained txs no longer block on Blockfrost indexing lag. The original "v5 can't decode Conway tag 258" failure no longer reproduces against cardano-preview's v5 Ogmios. Probe via `scripts/probe-blockfrost-evaluate.ts`; switch back to v6 JSON-RPC parsing if/when Blockfrost honors `?version=6` on the smart endpoint. | Every tx submission |
| `Address.prototype.toJSON` | Defensive — JSON.stringify on Address emits `{}` due to private fields | Anywhere Address gets serialized |
| `Hash28ByteBase16.fromEd25519KeyHashHex` shim | `tx@0.13.4` / `wallet@0.4.14` expect this as static method; `core@0.8.0` → `crypto@0.4.5` exposes only a callable | Withdraw (`addRequiredSigner`) and seed-phrase address derivation |

### Cleanup path

`@blaze-cardano/sdk@0.2.48` (current latest on npm as of 2026-05-20)
exact-pins the internally-consistent stack:

- `@blaze-cardano/core@0.8.0`
- `@blaze-cardano/tx@0.14.1` (no `fromEd25519KeyHashHex` calls)
- `@blaze-cardano/wallet@0.5.3` (no `fromEd25519KeyHashHex` calls)
- `@blaze-cardano/uplc@0.4.3`

Once it's safe to bump (post-M2), the cleanup sequence is roughly:

1. Bump `@blaze-cardano/sdk` to `^0.2.48` in `package.json` and `bun install`.
   May require relaxing `min-package-age` in `bunfig.toml` if the target
   version is younger than the threshold.
2. Verify `bun.lock` resolves `tx@0.14.1` and `wallet@0.5.3`.
3. Remove the `Hash28ByteBase16.fromEd25519KeyHashHex` shim from
   `blaze-patches.ts` (the call sites are gone).
4. Try dropping the `@blaze-cardano/core` and `@blaze-cardano/uplc`
   overrides — sdk@0.2.48 already pins them to the right versions.
5. Keep the `@cardano-sdk/core` override unless `@sundaeswap/wallet-lite`
   and `@cardano-sdk/dapp-connector` agree on a single 0.46.x line.
6. `Blockfrost.evaluateTransaction` and `Address.toJSON` patches stay
   until the upstream PRs land — they're not version-skew issues, they
   are bugs in the Blockfrost provider that ship in all current versions.

Track Blaze releases at https://github.com/butaneprotocol/blaze-cardano/releases.

---

## 📝 Technical Notes

### How Withdrawal Works (On-Chain)

From `cosponsor.ak`:

```aiken
fn cosponsor_ada_map(outputs, expired_proposals) {
  outputs |> list.foldl(dict.empty, fn(output, acc) {
    let key = when output_datum is {
      Before { cosponsored } -> {
        let procedure_hash = proposal_procedure_hash(cosponsored)
        if dict.has_key(expired_proposals, procedure_hash) {
          procedure_hash  // Expired: use specific hash
        } else {
          #""  // Non-expired: all grouped under empty key
        }
      }
      After -> #""
    }
    // ... accumulate ADA by key
  })
}
```

**Key insight:** For non-expired proposals, ALL UTxOs are grouped under `#""`. The validator just checks that:
- `burned_tokens + input_ada = output_ada` for each group
- Since all non-expired share the same group, ANY UTxO can be spent with ANY matching tokens

### Biggest-First Selection Strategy

We select script UTxOs biggest-first to:
1. Minimize transaction size (fewer inputs)
2. Avoid stranding small depositors (their small UTxOs are used last)
3. Keep the system healthy by consuming larger UTxOs first

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/lib/cardano/fetchUserDeposits.ts` | New withdrawal plan model |
| `src/lib/cosponsor-sdk/transactions/BrowserWithdrawal.ts` | Withdrawal tx with biggest-first |
| `src/lib/cosponsor-sdk/transactions/BrowserDeposit.ts` | Deposit tx builder |
| `scripts/debug-deposits.ts` | Debug/analysis script |

---

## Resources

- **Contracts:** `C:\Users\Mark\Documents\GitHub\cosponsor-contracts`
- **Progress:** `MILESTONES.md`
- **SDK Docs:** `readme-cosponsor-sdk.md`
