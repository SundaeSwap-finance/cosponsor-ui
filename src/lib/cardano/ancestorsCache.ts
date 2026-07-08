/**
 * Prev-governance-action-id ("ancestor") cache.
 *
 * Conway rejects NoConfidence / ConstitutionalCommittee (and other
 * state-threading) actions unless they name the currently-ENACTED action of
 * their purpose — a null ancestor is proven to burn the whole
 * gov_action_deposit once submitted. The ancestor is baked into the gADA
 * identity at DEPOSIT time, so the sponsor path (and the identity
 * derivation in `proposalIdentity.ts`, which must stay synchronous) needs
 * the resolved value. Same sync-cache pattern as
 * `useGovActionDeposit.getCachedGovActionDepositLovelace`.
 *
 * Resolution itself lives in the SDK (`resolveAncestor`, Koios-backed —
 * see the SDK README "Known limitations" #1 for why Koios).
 */

import {
  ANCESTOR_PURPOSE_BY_KIND,
  resolveAncestor,
  type TAncestorPurpose,
} from '@sundaeswap/cosponsor-sdk/utils'
import type { GovernanceAction } from '@sundaeswap/cosponsor-sdk/validators'
import { cosponsorApi } from '@/api/cosponsorApi'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

type TAncestor = GovernanceAction.IGovernanceActionId | null

/** Koios base per network (the SDK default is preview — make it explicit). */
export const koiosBaseUrl = (): string => {
  switch (config.blockfrostNetwork) {
    case 'mainnet':
      return 'https://api.koios.rest/api/v1'
    case 'preprod':
      return 'https://preprod.koios.rest/api/v1'
    default:
      return 'https://preview.koios.rest/api/v1'
  }
}

// `undefined` = not resolved yet; `null` = resolved as "purpose never
// enacted" (the only case where the ledger accepts a null ancestor).
const cache = new Map<TAncestorPurpose, TAncestor>()
let inflight: Promise<void> | null = null

const PURPOSES: TAncestorPurpose[] = ['Committee', 'Constitution', 'PParamUpdate', 'HardFork']

/**
 * Fetch all purposes from OUR backend's Koios proxy (GET /ancestors —
 * koios.rest sends no CORS headers, so browsers can't query it directly).
 */
const fetchAncestorsFromBackend = async (): Promise<void> => {
  const response = await cosponsorApi.get<Record<string, TAncestor>>('ancestors')
  for (const purpose of PURPOSES) {
    if (!(purpose in response.data)) {
      throw new Error(`ancestors proxy response missing purpose ${purpose}`)
    }
    cache.set(purpose, response.data[purpose] ?? null)
  }
}

/**
 * Resolve all purposes once and cache. Primary source: the backend proxy;
 * fallback: direct Koios (works in Node/dev tooling; CORS-blocked in
 * browsers, which is exactly why the proxy is primary).
 */
export const ensureAncestors = async (): Promise<void> => {
  if (PURPOSES.every((purpose) => cache.has(purpose))) {
    return
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        await fetchAncestorsFromBackend()
        return
      } catch (error) {
        logger.warn('[ancestorsCache] backend /ancestors failed, trying Koios direct', error)
      }
      const base = koiosBaseUrl()
      for (const purpose of PURPOSES) {
        cache.set(purpose, await resolveAncestor(purpose, { koiosBaseUrl: base }))
      }
    })().finally(() => {
      inflight = null
    })
  }
  await inflight
}

/**
 * Kind-aware warm-up: no-op (and no network) for kinds that thread no
 * ancestor (NicePoll, TreasuryWithdrawal), so a Koios outage/CORS block can
 * never break sponsoring or proposing those. Only NoConfidence /
 * ConstitutionalCommittee genuinely require the resolution and surface its
 * failure.
 */
export const ensureAncestorsForKind = async (actionKind: string): Promise<void> => {
  if (!ANCESTOR_PURPOSE_BY_KIND[actionKind]) {
    return
  }
  try {
    await ensureAncestors()
  } catch (error) {
    throw new Error(
      `Could not resolve the on-chain governance ancestor required for ${actionKind} ` +
        `proposals (governance-state lookup failed). Please try again shortly. ` +
        `(${error instanceof Error ? error.message : String(error)})`
    )
  }
}

/**
 * Synchronous cache read for `buildGovernanceAction`. Throws when the cache
 * is cold for an ancestor-threading kind — callers on user-action paths must
 * `await ensureAncestorsForKind()` first; the identity derivation treats the
 * throw as "identity not yet computable" and falls back gracefully.
 */
export const getCachedAncestorForKind = (actionKind: string): TAncestor => {
  const purpose = ANCESTOR_PURPOSE_BY_KIND[actionKind]
  if (!purpose) {
    return null // kind threads no ancestor
  }
  if (!cache.has(purpose)) {
    throw new Error(
      `Governance state for ${actionKind} (${purpose} ancestor) is still loading — try again in a moment.`
    )
  }
  return cache.get(purpose) ?? null
}

/**
 * Staleness guard for the propose path, cache/proxy-backed (the SDK's
 * `assertAncestorCurrent` queries Koios directly — CORS-blocked in
 * browsers). The ancestor was baked into the pool at DEPOSIT time; if an
 * enactment landed since, submitting burns the pooled gov deposit — refuse
 * instead. No-op (no network) for kinds without an ancestor purpose.
 */
export const assertAncestorCurrentCached = async (
  actionKind: string,
  fixtureAncestor: TAncestor | undefined
): Promise<void> => {
  const purpose = ANCESTOR_PURPOSE_BY_KIND[actionKind]
  if (!purpose) {
    return
  }
  await ensureAncestorsForKind(actionKind)
  const live = getCachedAncestorForKind(actionKind)
  const same =
    (live === null && !fixtureAncestor) ||
    (live !== null &&
      !!fixtureAncestor &&
      live.txHash === fixtureAncestor.txHash &&
      Number(live.index) === Number(fixtureAncestor.index))
  if (!same) {
    throw new Error(
      `This pool was pledged against an outdated ${purpose} governance ancestor — ` +
        'a newer action has since been enacted, so submitting now would be rejected ' +
        'by the ledger and burn the pooled deposit. The pool can only be withdrawn.'
    )
  }
}

// Warm the cache alongside the initial data fetch so card identities for
// ancestor-threading proposals are computable on first render. Swallowed on
// failure — user-action paths re-await ensureAncestors() and surface errors.
if (typeof window !== 'undefined') {
  ensureAncestors().catch((error) => logger.warn('[ancestorsCache] prefetch failed', error))
}
