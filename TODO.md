# Cosponsor UI - TODO & Issues

Last updated: 2026-05-21

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
- SDK published to npm as `@dezons/cosponsor-sdk@1.0.0-alpha.1`
- UI switched from local link to npm dependency
- Aiken token-addition guard implemented; deployment deferred to M3 (see
  `aiken/token-guard-m3` branch in cosponsor-contracts)

## 🧪 Open Feedback — Pi review 2026-05-20

Captured from Discord thread with Pi after the deploy went live at
https://cosponsor.preview.sundae.fi/all-proposals. Not blocking M2
submission per agreement, but to address before/during M3.

### Bugs

- [ ] **Number input renders a leading `0`** when typing into the
      amount field (screenshot in thread). Trim or use a controlled
      input that normalises on change.
- [ ] **"Your Pledges" → Sponsor button sponsors the wrong proposal.**
      Clicking "Sponsor" on an already-sponsored card in the Your
      Pledges tab ended up sponsoring a different proposal entirely.
      Likely a key/index mix-up between the list and the click handler.
- [ ] **Sponsor flow always creates a new proposal entry instead of
      adding to the existing one.** Used to group by proposal hash and
      bulk-withdraw — broke at some point, need to find when.
- [ ] **Sponsor attempt returned a Blockfrost evaluate error** ("script
      explicitly error'd" / unknown UTxOs). Same family as the withdraw
      Conway-CBOR issue — see the Blockfrost v6-routing summary below.
      Pi's read: the failure mode is "tx error'd" not "utxo missing",
      so worth re-checking whether the v6/v5 mismatch is what's biting
      this path too.
- [ ] **Datum contains a hardcoded URL placeholder.** Pi's concern:
      "why is there a URL in the datum at all" + suspects something
      may be double-hashing. Current value is a placeholder because
      GovTools BE isn't lined up yet — needs a real anchor source or
      explicit nullable handling.

### UX improvements

- [ ] **"Your Pledges" cards should have an inline Withdraw button.**
      Right now users have to click into the proposal first.
- [ ] **Group deposits per proposal in the listing.** Used to work
      (bulk-withdraw); regression.

### Open questions

- [ ] Are treasury withdrawals 50k ADA deposit on preview? (Pi asked,
      not yet answered — confirm the on-chain parameter and reflect it
      in the UI's min-pledge / suggested-amount copy if relevant.)
- [ ] `NicePoll` label — Mark identified this as the Info Action
      proposal-type from the GovTools mock data. Confirm the mapping
      and either rename for users or surface the real type once the
      GovTools BE is wired.
- [ ] Governance-action submission flow — not part of M2 scope (Pi
      confirmed) but flagged for M3.

### Catalyst submission

- [ ] Confirm with Jenisis whether processing the above is a blocker
      for M2 submission (Mark's read: shouldn't be — feedback handling
      is "process feedback and go make improvements", not part of M2
      acceptance criteria). Awaiting answer.

### SDK bug — NewConstitution datum serialization

Report to Pi. `fetchUserDeposits` / `fetchWithdrawalPlan` throw when
processing any UTxO with a `NewConstitution` governance action:

```
Failed to serialize: Invalid object at root.procedure.governanceAction.NewConstitution.constitution:
Enum variant must have a constructor index
```

The SDK then falls back to the **first UTxO's anchor URL** when reading
back the user's gADA tokens, so a NewConstitution deposit silently
shows up labelled as some other proposal (whichever URL happened to be
first in the list). On preview 2026-05-22 the user's 5,000 tADA NC
deposit appeared as Info Action because of this.

UI workaround in place (2026-05-22): grouping by `tokenAssetName`
instead of recovered URL id so misattributed deposits stay separate.
Once the SDK fixes the serializer the grouping can return to URL-based
for cross-procedure aggregation if desired.

### Cosponsor proposal identity (Stage 2)

`ModalSponsor.tsx` Stage 1 fix (2026-05-22): `cosponsoredProposal.deposit` now uses the gov_action_deposit (constant per network) instead of the user's pledge. Result: multiple deposits on the same proposal hash to the same on-chain token / aggregate properly in Your Pledges.

What's still broken: the URL id (`/proposal/<id>`) doesn't match the on-chain proposal hash, so navigating directly to a proposal page can't show the deposits.

The on-chain hash = `cosponsoredProposalProcedureData.hash()` over a PlutusData structure containing `{deposit, returnAddress, action, anchor}`. To make URL ids match:

- [ ] **Preferred**: ask Pi to expose `computeProposalHash(cosponsoredProposal): string` as public API from `@sundaeswap/cosponsor-sdk`. Then UI calls it at proposal-construction time (mock factory + GovTools transform) and uses the result as `proposal.id`.
- [ ] **Fallback**: reimplement the construction in the UI using Blaze's PlutusData primitives (mirror `buildCosponsoredProposalProcedureAsPlutusData` plus the 7 `build*AsPlutusData` action serializers in `@sundaeswap/cosponsor-sdk/dist/GovernanceAction-*.mjs`). ~80 lines, must stay in sync with SDK.

Once that lands: `getMockProposal` and `transformToProposalCard` both call the hash function and set `proposal.id = computedHash`; `/proposal/<id>` routes to a stable identity that matches what ends up on-chain.

### SDK dependency bump (for `@sundaeswap/cosponsor-sdk`)

Pi to update the SDK's `package.json` to the internally-consistent
Blaze 0.8.0 stack so the UI can drop the override stack:

```jsonc
"dependencies": {
  "@blaze-cardano/core": "^0.8.0",
  "@blaze-cardano/data": "^0.6.6",
  "@blaze-cardano/ogmios": "^0.0.7",
  "@blaze-cardano/sdk": "^0.2.48",
  "@blaze-cardano/uplc": "^0.4.3"
}
```

Already messaged in the same thread; rationale lives in the Tech Debt
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
| `Blockfrost.evaluateTransaction` rewrite | Five upstream bugs in Blockfrost provider (see file header for full report) | Every tx submission |
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
