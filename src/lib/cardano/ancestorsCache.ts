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

/** Resolve all purposes once (single Koios query each; results cached). */
export const ensureAncestors = async (): Promise<void> => {
  if (PURPOSES.every((purpose) => cache.has(purpose))) {
    return
  }
  if (!inflight) {
    inflight = (async () => {
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

// Warm the cache alongside the initial data fetch so card identities for
// ancestor-threading proposals are computable on first render. Swallowed on
// failure — user-action paths re-await ensureAncestors() and surface errors.
if (typeof window !== 'undefined') {
  ensureAncestors().catch((error) => logger.warn('[ancestorsCache] prefetch failed', error))
}
