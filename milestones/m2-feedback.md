# Milestone 2 - Internal Testing Feedback & Progress

**Testing Period:** February 16 - 19, 2026
**Testers:** 6 internal team members
**Method:** Structured questionnaire + hands-on testnet testing

---

## Summary

6 internal testers evaluated the CoSponsor testnet platform. Browsing proposals and the general UI scored well (avg 4.5/5 and 4.3/5), but the **contribution flow was critically broken** for most testers due to an expired/invalid Blockfrost API token. This single issue cascaded into low scores for contributions (avg 2.2/5) and refunds (avg 3.0/5). Beyond the blocker, testers surfaced real UX issues around search, filtering, fee transparency, and onboarding clarity.

**Value proposition validated:** 4/6 testers said "Strongly yes" or "Yes" to seeing value in CoSponsor; 4/6 would consider contributing funds.

---

## Tester Profiles

| # | Date | Experience | What They Tested | Internal/External |
|---|------|-----------|-----------------|-------------------|
| 1 | 2026-02-16 | Advanced | Browsing, UI navigation | Internal |
| 2 | 2026-02-19 | Developer/Technical | Browsing, Contributing, Wallet, UI | Internal |
| 3 | 2026-02-19 | Beginner | Browsing, Wallet, UI | Internal |
| 4 | 2026-02-19 | Developer/Technical | Browsing, Contributing, Wallet, UI | Internal |
| 5 | 2026-02-19 | Developer/Technical | Browsing, Contributing, Wallet, UI | Internal |
| 6 | 2026-02-19 | Advanced (review only) | Browsing, Wallet, UI | Internal |

---

## Scores (1-5 scale)

| Metric | T1 | T2 | T3 | T4 | T5 | T6 | Avg |
|--------|----|----|----|----|----|----|-----|
| Browsing proposals worked | 5 | 5 | 5 | 5 | 3 | 4 | **4.5** |
| Contribution process worked | 5 | 1 | 3 | 1 | 1 | 2 | **2.2** |
| Refund mechanism worked | 5 | 1 | 3 | - | - | 3 | **3.0** |
| Purpose was clear | 5 | 1 | 2 | 2 | 3 | 5 | **3.0** |
| Interface easy to understand | 5 | 4 | 3 | 5 | 4 | 5 | **4.3** |
| Comfortable using in future | 5 | 5 | 2 | 5 | 4 | 4 | **4.2** |

| Value proposition | Count |
|-------------------|-------|
| Strongly yes | 3 |
| Yes | 1 |
| Neutral | 2 |

| Would contribute funds? | Count |
|------------------------|-------|
| Yes | 2 |
| Maybe / Depends | 3 |
| No | 1 |

---

## Critical Issues (Blockers)

### C1. Blockfrost "Invalid project token"
- **Reported by:** Testers 2, 3, 4, 5 (4/6)
- **Severity:** Critical / Blocker
- **Error:** `Error: getParameters: Blockfrost threw "Invalid project token."`
- **Impact:** Completely blocks the contribution (sponsor) flow. Most testers could not complete a deposit.
- **Root cause:** Expired or misconfigured Blockfrost API key in the deployed testnet build.
- **Fix:** Rotate/update the Blockfrost project token and ensure env config is correct for the deployed build.

### C2. Unknown governance action category mapping
- **Reported by:** Tester 3
- **Severity:** Critical
- **Error:** `Error: Unknown governance action category: "info action". Valid categories: Info Action, Treasury Withdrawal, TreasuryWithdrawals, Treasury requests, Protocol Parameters, Hard Fork, No Confidence, Constitutional Committee, New Constitution, Updates to the Constitution, NicePoll`
- **Impact:** Cannot sponsor proposals with certain governance action types.
- **Root cause:** Case-sensitive / inconsistent category name mapping. The chain returns "info action" (lowercase) but the code expects "Info Action" (title case).
- **Fix:** Normalize governance action category matching to be case-insensitive, and map all known variants.

### C3. Ogmios script evaluation failure
- **Reported by:** Tester 6
- **Severity:** Critical
- **Error:** `Ogmios evaluation failed: {"code":3010,"message":"Some scripts of the transactions terminated with error(s).","data":[{"validator":{"index":0,"purpose":"mint"},"error":{"code":3004,"message":"Unable to create the evaluation context from the given transaction.","data":{"reason":"Unknown transaction input (missing from UTxO set): 56b2117f...#6"}}}]}`
- **Impact:** Transaction building fails when Ogmios can't find referenced UTxOs.
- **Root cause:** The evaluator references a UTxO that has been spent or doesn't exist in the Ogmios UTxO set. Possibly stale script reference UTxO or chained transaction issue.
- **Fix:** Verify script reference UTxOs are still live on-chain; ensure evaluator handles missing UTxOs gracefully.

---

## Functional Issues

### F1. Search doesn't work
- **Reported by:** Testers 3, 5
- **Severity:** High
- **Description:** Searching proposals by title doesn't return results. Only works if the term matches a dropdown list entry. Free-text search returns nothing.
- **Fix:** Implement proper text search/filtering across proposal titles (and possibly descriptions).

### F2. Filters not wired up
- **Reported by:** Tester 3
- **Severity:** Medium
- **Description:** Filter buttons don't do anything. Already identified in M1 issue list (`ButtonProposalFilter.tsx`).
- **Fix:** Wire up filter callbacks (already tracked as M2 improvement #1).

### F3. Transaction fee not explained
- **Reported by:** Tester 3
- **Severity:** Low-Medium
- **Description:** "When I tried to pledge 1 ADA, the transaction fee is 2.5. When I pledge 1900, transaction fee is also 2.5. Is the transaction fee fixed?"
- **Impact:** Users confused by flat fee structure. Need to explain that Cardano tx fees are protocol-based (not proportional to amount).
- **Fix:** Add a tooltip or info text near the fee display explaining that Cardano transaction fees are fixed by the protocol and don't scale with pledge amount.

---

## UX Issues

### U1. Platform purpose not clear enough
- **Scores:** avg 3.0/5 for "purpose was clear"
- **Reported by:** Testers 2, 3, 4 (scored 1-2)
- **Suggestion (Tester 2):** "An about section would be useful"
- **Concern (Tester 6):** "not knowing that you get your deposit refunded even if the proposal does not pass"
- **Fix:** Add an "About" / "How it works" section explaining: what CoSponsor does, the deposit/refund lifecycle, and that funds are returned if the proposal doesn't pass.

### U2. Layout too vertically long
- **Reported by:** Tester 2
- **Description:** Page layout feels stretched vertically.
- **Fix:** Review page layout density, consider tighter spacing or collapsible sections.

### U3. UI snappiness / polish
- **Reported by:** Tester 1
- **Description:** "Just some polish in snappiness of UI would be nice"
- **Fix:** Review loading states, transitions, and perceived performance. Add skeleton loaders (already tracked as M2 improvement #2).

### U4. Refund clarity / trust
- **Reported by:** Tester 6
- **Description:** "A general concern would be not knowing that you get your deposit refunded even if the proposal does not pass."
- **Fix:** Add clear messaging about the refund guarantee, ideally on the contribution modal and an FAQ/About section.

---

## Positive Feedback (What Worked Well)

- **Wallet connection** works well, including Eternl (Testers 3, 5, 6)
- **Browsing proposals** is smooth and functional (avg 4.5/5)
- **UI is clean and liked overall** - "I like the UI" (Tester 5), "Functionally it was very clear and easy to use" (Tester 1)
- **Proposal tile interaction** - "Clicking anywhere on a proposal tile opens its details" (Tester 6)
- **Listing and viewing proposal details** works well (Tester 2)
- **Category horizontal scrolling** works with trackpad (Tester 6)
- **Strong concept validation** - "Solid platform" (Tester 1)
- **Trust in Sundae Labs** - "I wouldn't have any concerns knowing that Sundae Labs built it!" (Tester 6)

---

## Governance Action Types of Interest

| Type | Mentions |
|------|----------|
| Treasury allocation proposals | 2 |
| Protocol Parameter changes | 2 |
| Generic Info-actions / community-led policy initiatives | 2 |
| Developer tools | 1 |
| Constitutional Committee updates / No-confidence votes | 1 |

---

## User Concerns About Using CoSponsor

| Concern | Tester |
|---------|--------|
| Capital inefficiency from locking up funds | T2 |
| Not knowing funds are refunded if proposal fails | T6 |

---

## Consolidated Action Items

### Priority 1 - Blockers (must fix)
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 1 | ~~Fix/rotate Blockfrost API token~~ | C1 | `.env`, deployment config | Done | Timing issue - token rotated during test window, not a code bug |
| 2 | ~~Case-insensitive governance action category mapping~~ | C2 | `ModalSponsor.tsx` | Done | Lowercased all keys in `CATEGORY_TO_ACTION_KIND` map, added `.toLowerCase()` to lookup in `mapCategoryToActionKind()` |
| 3 | ~~Fix Ogmios evaluation UTxO reference error~~ | C3 | `ModalSponsor.tsx` | Done | Added missing `if (OGMIOS_URL)` guard to `handleSponsor` (was already present in preview path), added user-friendly error for stale UTxO errors, removed dead `evaluateWithOgmios` debug function |

### Priority 2 - Functional fixes
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 4 | ~~Fix proposal search (free-text)~~ | F1 | `ModalSearchProposals.tsx` | Done | Added `shouldFilter={false}` to `Command` (cmdk) component — its built-in filtering was conflicting with the custom `useEffect` filter, hiding results even when the filter correctly matched |
| 5 | ~~Wire up type filter~~ | F2 | `ButtonProposalFilter.tsx`, `SectionTitleProposalsView.tsx`, `PageProposalsAll.tsx` | Done | Added `onTypeFilter` callback prop through component chain, mapped short filter names to full category names, `PageProposalsAll` now shows/hides carousels based on selected types |

### Priority 3 - UX improvements
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 6 | ~~Add "About" / "How it works" section~~ | U1, U4 | `PageAbout.tsx`, `Router.tsx`, `Sidebar.tsx` | Done | New `/about` page with 4-step how-it-works flow, FAQ section (covers refunds, gADA tokens, fees, safety), non-custodial trust callout, sidebar link on desktop + mobile |
| 7 | ~~Add refund guarantee messaging~~ | U4 | `PageAbout.tsx` | Done | Covered in About page FAQ: "Your ADA is always safe. You can withdraw your full contribution at any time, regardless of whether the proposal passes, fails, or expires." |
| 8 | ~~Add fee explanation tooltip~~ | F3 | `LineOrderDetails.tsx`, `ModalSponsor.tsx`, `ModalWithdraw.tsx` | Done | Added optional `labelTooltip` prop to `LineOrderDetails`, applied to fee line in both sponsor and withdraw modals: "Cardano network fees are set by the protocol and do not scale with your pledge/withdrawal amount." |
| 9 | ~~Add skeleton loading for proposals~~ | U3 | `CardProposal.tsx`, `CarouselProposals.tsx`, new `skeleton.tsx` | Done | Created `Skeleton` shadcn component, added `CardProposalSkeleton` with matching card dimensions, replaced spinner in carousel loading state with 4 skeleton cards to prevent layout flicker |
| 10 | ~~Review vertical layout density~~ | U2 | `PageProposalsAll.tsx`, `PageProposalsCategory.tsx`, `SectionTitleProposalsView.tsx` | Done | Tightened page gap `gap-8` → `gap-6`, section title outer gap `gap-6` → `gap-4`, title/subtitle inner gap `gap-4` → `gap-2`, header bottom padding `md:pb-6` → `md:pb-4`. Applied consistently across all proposals pages. |
| 11 | UI polish / perceived performance | U3 | General | Deferred | Skeleton loading (#9) and layout tightening (#10) address the main concerns. Further polish can be revisited later. |

### Priority 4 - Deeper filter integration
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 12 | ~~Wire up per-proposal filtering (Status, Budget, Fund Progress, Expiration)~~ | F2 | `ButtonProposalFilter.tsx`, `CarouselProposals.tsx`, `SectionTitleProposalsView.tsx`, `PageProposalsAll.tsx`, new `ProposalFilters.ts` | Done | Created `IProposalFilters` type, wired callbacks through component chain, added `applyIProposalFilters` with client-side filtering by status (Active/Completed/Expired), budget range, fund progress %, and expiration date range. Creator filter still uses hardcoded test data (needs real user data from API). |

### Priority 5 - Audits
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 13 | ~~Code audit (quality, dead code, security)~~ | Internal | Codebase-wide | Done | See `audit-2026-04-09.md` — 89 files analyzed, 27 issues found (6 critical, 15 warnings), 5 auto-fixed (filename issues, missing useEffect cleanup, import path mismatch) |
| 14 | ~~Package audit (vulnerabilities, outdated/unused deps)~~ | Internal | `package.json` | Done | See package audit section below |

### From original M2 plan (code quality)
| # | Item | Source | File(s) | Status | Resolution |
|---|------|--------|---------|--------|------------|
| 15 | ~~CIP-25 metadata chunking refactor~~ | M2 issue #4 | `BrowserDeposit.ts`, new `metadataUtils.ts` | Done | Extracted inline `chunkImageData()` to named `chunkCip25Text()` in `cosponsor-contracts/offchain/src/browser/metadataUtils.ts`. Properly named, documented, exported from SDK browser index. 3 call sites updated in BrowserDeposit.ts. |

### Already tracked from M1 (overlap)
| Original M2 Item | Maps to |
|-------------------|---------|
| #1 Filter callbacks (`ButtonProposalFilter.tsx`) | Action #5 (type filter done), #12 (remaining filters) |
| #2 Skeleton loading (`CardProposal.tsx`) | Action #9 |
| #3 Carousel filtered items (`CarouselProposals.tsx`) | Action #12 |
| #4 CIP-25 metadata chunking (`BrowserDeposit.ts`) | Action #15 |

---

## Known Shortcomings & Caveats

Items that are functionally complete but have known limitations:

### #3 - Ogmios evaluation (partial fix)
The error message is improved and the `OGMIOS_URL` guard prevents crashes when unconfigured, but the **root cause** is not fixed. If a script reference UTxO gets spent on-chain, transactions will still fail — the user just gets a clearer error ("refresh and try again") instead of a raw Ogmios dump.

### #4 - Search (no debounce, limited fields)
The cmdk conflict is fixed and free-text search works. However:
- Search does **not** include the `abstract` field — only name, ownerName, companyName, companyDomain, categoryName
- **No debounce** on the search input — every keystroke triggers `getAllProposalCards()` (which does have a 5-minute cache, so the API isn't hammered, but the filter runs on every keystroke)

### #8 - Fee tooltip (fallback estimate still inflated)
The tooltip explains that fees are protocol-set. However, when the transaction preview build fails (e.g., due to Blockfrost issues), the fallback fee estimate is **hardcoded at 2.5 ADA** (`ModalSponsor.tsx`), which is much higher than actual fees (~0.3-0.5 ADA). Tester 3 noticed this discrepancy. The fallback should be lowered or removed.

### #12 - Filters (Creator hardcoded, no empty state)
- **Creator / dRep filter** still uses hardcoded test user data (`FilterPropCreator.tsx`) — needs real user/dRep data from the cosponsor-api backend (2026-07-01: UI migrated off the external GovTools API) or chain
- When all proposals in a category are filtered out, the **carousel section disappears entirely** with no feedback. Should show a "no matching proposals" message instead.
- Filter state resets when the popover closes (state lives inside `ButtonProposalFilter`, not persisted to URL or parent)

---

## Package Audit (completed 2026-04-09)

### Methodology
3 independent audit agents (security/vulnerabilities, outdated/unused, quality/architecture) cross-referenced by 2 consensus agents.

### Actions Taken

| # | Action | Status |
|---|--------|--------|
| 1 | Updated `react-router-dom` from 7.6.3 to 7.14.0 (patched 5 HIGH vulns: XSS, CSRF, open redirect) | Done |
| 2 | Pinned `@types/bun` from `"latest"` to `"^1.3.11"` | Done |
| 3 | Moved 9 dev-only packages from `dependencies` to `devDependencies`: `@eslint/js`, `@tailwindcss/vite`, `@vitest/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-plugin-simple-import-sort`, `globals`, `prettier`, `prettier-plugin-tailwindcss`, `typescript-eslint` | Done |
| 4 | Removed `date-fns` from direct dependencies (transitive only via react-day-picker, was causing version conflict with @sundaeswap/ui-toolkit) | Done |

### Known Issue: React 18/19 Peer Dependency Mismatch

The app uses **React 19**. Two `@sundaeswap` packages have React 18 peer dependencies:
- `@sundaeswap/wallet-lite@0.0.92` — peers on `react: ^18.3.1`
- `@sundaeswap/ui-toolkit@2.3.6` — peers on `react: 18.3.1` (exact pin)

This works today because React 19 maintained backward compatibility with most React 18 patterns. However:
- React 19 changed ref forwarding, concurrent rendering defaults, and context behavior
- `npm install` flags these as invalid peer dependencies
- If `@sundaeswap` releases React 19-compatible versions, update immediately
- If subtle runtime bugs appear (especially around context, refs, or suspense), this mismatch is the first place to look

### Accepted Risks

| Finding | Verdict |
|---------|---------|
| pbkdf2/sha.js CRITICAL vulns (transitive via @blaze-cardano) | **Not exploitable** — app uses CIP-30 wallet bridge, private keys never touch this code. Upstream fix required from @cardano-sdk/crypto. |
| Vite 7.0 dev server vulns (path traversal, file read) | **Dev-only** — not in production builds. Should update when convenient. |
| 63 total npm audit vulns | Majority are in transitive trees of dev deps (now correctly categorized) or non-exploitable crypto polyfills. Run `npm audit --production` after changes for accurate count. |

### Deferred / Should Do Later

| Action | Priority |
|--------|----------|
| Update Vite to latest 7.x patch | Should do |
| Remove duplicate `tailwindcss-radix` from devDeps | Should do |
| Re-run `npm audit --production` to get real vuln count | Should do |
| Replace `axios` with native `fetch` (1 file, ~15KB saved) | Consider |
| Major version bumps (@blaze-cardano, lucide-react, etc.) | Consider — case by case |
