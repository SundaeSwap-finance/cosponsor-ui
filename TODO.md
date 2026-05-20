# Cosponsor UI - TODO & Issues

Last updated: 2026-05-20

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
