/**
 * proposalTotals — chain-state hub for cosponsor pool data
 * ---------------------------------------------------------------------------
 *
 * Single source of truth for everything the UI knows about the cosponsor
 * script address. One call to the SDK's `fetchWithdrawalPlan` per page,
 * shared via a short-TTL module cache. All downstream views (proposal
 * progress totals, the connected wallet's pledges) are *pure derivations*
 * over that plan — no extra Blockfrost roundtrips, no duplicated scans.
 *
 * Why this lives in the UI for now: the canonical home for this aggregation
 * is a backend indexer (running alongside the GovTools BE). Until that's
 * in place, the UI does the scan client-side. The shape returned here is
 * the same shape the BE should expose via API — so this doubles as the
 * reference implementation.
 *
 * ---------------------------------------------------------------------------
 * Algorithm (mirror in BE indexer)
 * ---------------------------------------------------------------------------
 * 1. List every UTxO at the cosponsor script address.
 * 2. For each UTxO:
 *    a. Decode its inline datum (`CosponsorDatum::Before { cosponsored }`).
 *    b. Compute `proposalHash = blake2b_256(cosponsoredProposalProcedure)`
 *       — this is the gADA token asset name.
 *    c. Decode `cosponsored.anchor.url` (hex → utf-8 → URL string).
 *    d. Extract the URL-space proposal id by matching `/proposal/<hex>`.
 *    e. Read the UTxO's locked ADA (lovelace).
 * 3. Aggregate locked ADA per proposal (by URL id and by hash) and record a
 *    canonical `proposalHash → urlId` map for enrichment.
 * 4. User-bound view: correlate the wallet's gADA token holdings with the
 *    script UTxO list by `tokenAssetName === proposalHash`. UTxOs whose
 *    datum didn't decode get no anchor — we don't fabricate one (see
 *    "Why we don't reuse the SDK's fetchUserDeposits" below).
 *
 * ---------------------------------------------------------------------------
 * Why we don't reuse the SDK's fetchUserDeposits
 * ---------------------------------------------------------------------------
 * The SDK's legacy `fetchUserDeposits` falls back to "first UTxO's anchor
 * URL" when a token can't be matched to a decoded script UTxO. With the
 * current NewConstitution datum serialization bug, that fallback labels NC
 * deposits with an unrelated proposal's URL — see TODO.md. `deriveUserDeposits`
 * below skips the fallback entirely: unmatched tokens stay generic. When
 * Pi's SDK fix lands and every datum decodes cleanly, the fallback is
 * effectively unreachable anyway.
 *
 * ---------------------------------------------------------------------------
 * Wallet dependency
 * ---------------------------------------------------------------------------
 * `fetchWithdrawalPlan` is wallet-bound even though only the script-side of
 * the scan is wallet-independent. For chain-state-only queries (e.g.
 * pre-connect proposal listings) we hand the SDK a read-only Blaze with a
 * stub wallet whose `getUnspentOutputs` returns `[]`. See `blaze.ts`.
 */

import type { Blaze, Provider, Wallet } from '@blaze-cardano/sdk'
import {
  fetchWithdrawalPlan,
  type IScriptUtxo,
  type IUserDeposit,
  type IWithdrawalPlan,
} from '@sundaeswap/cosponsor-sdk/browser'
import { logger } from '@/lib/logger'

/**
 * One on-chain contribution to a proposal (= one script UTxO).
 * The BE indexer will likely surface this as a row in a `pledges` table
 * keyed by (txHash, outputIndex). For now the wallet/owner of each pledge
 * isn't recoverable from the script UTxO alone (it lives in the minting
 * tx); the BE can recover it by walking back to the mint and reading the
 * payer's address from the inputs.
 */
export interface IPledgeBreakdown {
  txHash: string
  outputIndex: number
  /** lovelace locked at this UTxO */
  lockedAmount: bigint
}

export interface IProposalTotals {
  /** lovelace pledged keyed by URL-space proposal id (e.g. `deadbeef…063f7`). */
  byUrlId: Map<string, bigint>
  /** lovelace pledged keyed by on-chain proposal hash (= gADA token asset name). */
  byProposalHash: Map<string, bigint>
  /** per-UTxO breakdowns keyed by URL-space proposal id. */
  pledgesByUrlId: Map<string, IPledgeBreakdown[]>
  /** per-UTxO breakdowns keyed by on-chain proposal hash. */
  pledgesByProposalHash: Map<string, IPledgeBreakdown[]>
  /**
   * Canonical proposalHash → URL-space id mapping, derived from script UTxOs
   * whose datum decoded successfully. Use this for enrichment in places that
   * have a gADA tokenAssetName (= proposalHash) but no trustworthy URL —
   * e.g. Your Pledges, where the SDK's per-token `proposalUrl` falls back to
   * an unrelated UTxO's anchor when the deposit's datum fails to decode
   * (current NewConstitution serialization bug). Missing entries mean the
   * on-chain anchor URL couldn't be recovered for that proposal — callers
   * should leave the card generic rather than guess.
   */
  urlIdByProposalHash: Map<string, string>
}

// ---------------------------------------------------------------------------
// Plan cache
// ---------------------------------------------------------------------------

/** How long a cached plan is considered fresh. Picked to absorb back-to-back
 * page navigations without going stale enough to mask a user's own tx. */
const PLAN_TTL_MS = 30_000

interface ICachedPlan {
  plan: IWithdrawalPlan
  expiresAt: number
}

let cachedPlan: ICachedPlan | undefined
let inFlight: Promise<IWithdrawalPlan> | undefined

/**
 * Fetch the cosponsor withdrawal plan (script UTxOs + connected wallet's
 * gADA tokens) with a short-lived module cache. Concurrent callers share
 * one in-flight request. Call `invalidateChainPlanCache` on wallet
 * change and after the user submits a sponsor/withdraw tx to drop stale
 * state immediately.
 */
export const fetchCachedWithdrawalPlan = (
  blaze: Blaze<Provider, Wallet>
): Promise<IWithdrawalPlan> => {
  const now = Date.now()
  if (cachedPlan && cachedPlan.expiresAt > now) {
    return Promise.resolve(cachedPlan.plan)
  }
  if (inFlight) {
    return inFlight
  }
  // `fetchWithdrawalPlan` is from the SDK and expects the SDK's
  // `Blaze<Provider, Wallet>`; the `blaze` parameter is typed against the
  // UI's pinned 0.8.0 copy. Same shape at runtime — version-skew per
  // TODO.md "Tech Debt: Blaze Override Stack" (task #8).
  inFlight = fetchWithdrawalPlan(blaze as unknown as Parameters<typeof fetchWithdrawalPlan>[0])
    .then((plan) => {
      cachedPlan = { plan, expiresAt: Date.now() + PLAN_TTL_MS }
      return plan
    })
    .finally(() => {
      inFlight = undefined
    })
  return inFlight
}

/** Drop the cached plan so the next call refetches. Use after wallet
 * connect/disconnect/switch and after a user-submitted tx. */
export const invalidateChainPlanCache = () => {
  cachedPlan = undefined
}

// ---------------------------------------------------------------------------
// Pure derivations
// ---------------------------------------------------------------------------

/**
 * Recover the URL-space id from a deposit's anchor URL.
 *
 * Anchor URLs follow `https://cosponsor.app/proposal/<id>` where `<id>` is
 * either the mock id (`deadbeef…<cat>`) or a GovTools proposal id once
 * that BE is wired. Anything that doesn't match returns undefined and the
 * caller falls back to the on-chain proposal hash.
 */
const extractUrlId = (anchorUrlHex: string | undefined): string | undefined => {
  if (!anchorUrlHex) {
    return undefined
  }
  let decoded: string
  try {
    decoded = Buffer.from(anchorUrlHex, 'hex').toString('utf-8')
  } catch {
    return undefined
  }
  const match = decoded.match(/\/proposal\/([a-f0-9]+)$/i)
  return match?.[1]
}

/**
 * Pure aggregation of locked ADA per proposal from an already-fetched plan.
 * Two parallel maps so consumers can look up by either identifier the UI
 * knows about (URL id) or the SDK-internal one (on-chain hash).
 */
export const aggregateProposalTotals = (plan: IWithdrawalPlan): IProposalTotals => {
  const byUrlId = new Map<string, bigint>()
  const byProposalHash = new Map<string, bigint>()
  const pledgesByUrlId = new Map<string, IPledgeBreakdown[]>()
  const pledgesByProposalHash = new Map<string, IPledgeBreakdown[]>()
  const urlIdByProposalHash = new Map<string, string>()

  const pushBreakdown = (
    map: Map<string, IPledgeBreakdown[]>,
    key: string,
    pledge: IPledgeBreakdown
  ) => {
    const existing = map.get(key)
    if (existing) {
      existing.push(pledge)
    } else {
      map.set(key, [pledge])
    }
  }

  for (const utxo of plan.scriptUtxos as IScriptUtxo[]) {
    const amount = utxo.lockedAmount
    const pledge: IPledgeBreakdown = {
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex,
      lockedAmount: amount,
    }
    if (utxo.proposalHash) {
      byProposalHash.set(utxo.proposalHash, (byProposalHash.get(utxo.proposalHash) ?? 0n) + amount)
      pushBreakdown(pledgesByProposalHash, utxo.proposalHash, pledge)
    }
    const urlId = extractUrlId(utxo.anchor?.url)
    if (urlId) {
      byUrlId.set(urlId, (byUrlId.get(urlId) ?? 0n) + amount)
      pushBreakdown(pledgesByUrlId, urlId, pledge)
    }
    // Both hash and URL decoded: record canonical mapping for enrichment.
    // First write wins — subsequent UTxOs to the same proposal should
    // have identical anchors, but guarding against any drift keeps a
    // single misminted UTxO from clobbering a known-good mapping.
    if (utxo.proposalHash && urlId && !urlIdByProposalHash.has(utxo.proposalHash)) {
      urlIdByProposalHash.set(utxo.proposalHash, urlId)
    }
  }

  logger.debug(
    `[proposalTotals] aggregated ${plan.scriptUtxos.length} UTxOs → ${byUrlId.size} URL ids, ${byProposalHash.size} on-chain hashes`
  )

  return {
    byUrlId,
    byProposalHash,
    pledgesByUrlId,
    pledgesByProposalHash,
    urlIdByProposalHash,
  }
}

/**
 * Convenience wrapper: cache-aware fetch + aggregate. Existing call sites
 * that just want the totals can keep using this.
 */
export const fetchProposalTotals = async (
  blaze: Blaze<Provider, Wallet>
): Promise<IProposalTotals> => {
  const plan = await fetchCachedWithdrawalPlan(blaze)
  return aggregateProposalTotals(plan)
}

/**
 * Derive per-proposal user deposits by correlating the connected wallet's
 * gADA tokens with the script UTxO list. Unmatched tokens (decode failure
 * on the SDK side) get generic metadata — we deliberately skip the SDK's
 * "first UTxO" anchor fallback because it relabels deposits as unrelated
 * proposals (see module header).
 */
export const deriveUserDeposits = (plan: IWithdrawalPlan): IUserDeposit[] => {
  const utxoByProposalHash = new Map<string, IScriptUtxo>()
  for (const utxo of plan.scriptUtxos as IScriptUtxo[]) {
    if (utxo.proposalHash) {
      utxoByProposalHash.set(utxo.proposalHash, utxo)
    }
  }

  return plan.userTokens.map((token): IUserDeposit => {
    const matched = utxoByProposalHash.get(token.tokenAssetName)
    if (matched) {
      return {
        tokenAssetName: token.tokenAssetName,
        tokenAmount: token.tokenAmount,
        depositTxHash: matched.txHash,
        depositOutputIndex: matched.outputIndex,
        depositAmount: token.tokenAmount,
        // Full typed procedure (post-SDK-widening). `null` when the SDK
        // couldn't losslessly reconstruct the action — Sponsor flow falls
        // back to building from card fields in that case.
        cosponsoredProposal: matched.cosponsoredProposal,
        actionSummary: {
          deposit: token.tokenAmount,
          anchor: matched.anchor,
          action: { kind: matched.actionKind },
        },
        proposalUrl: matched.anchor.url
          ? Buffer.from(matched.anchor.url, 'hex').toString()
          : 'On-chain proposal',
        proposalHash: token.tokenAssetName,
        unmatched: false,
      }
    }
    return {
      tokenAssetName: token.tokenAssetName,
      tokenAmount: token.tokenAmount,
      depositTxHash: '',
      depositOutputIndex: 0,
      depositAmount: token.tokenAmount,
      cosponsoredProposal: null,
      actionSummary: {
        deposit: token.tokenAmount,
        anchor: { url: '', hash: '' },
        action: { kind: 'Unknown' },
      },
      proposalUrl: 'On-chain proposal',
      proposalHash: token.tokenAssetName,
      unmatched: true,
    }
  })
}

/** Convert lovelace to ADA for UI display. */
export const lovelaceToAda = (lovelace: bigint): number => Number(lovelace) / 1_000_000
