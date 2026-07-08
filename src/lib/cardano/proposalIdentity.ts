/**
 * Stage-2 proposal identity: derive the on-chain proposal hash (= gADA token
 * asset name) at card-construction time and use it as the URL-space
 * `proposal.id`. Same hash on the listing card, the route (`/proposal/<id>`),
 * the `ModalSponsor` mint procedure, and any future deposit's gADA token —
 * one identity end-to-end so the detail page can lookup deposits by id
 * without an extra hash↔url mapping table.
 *
 * The hash depends on `{ deposit, returnAddress, action, anchor }`. We need a
 * stable anchor that doesn't itself depend on `proposal.id` (otherwise we'd
 * have a fixed-point equation). Solution: use the *source* id (mock category
 * id / GovTools numeric id / …) in the anchor URL. ModalSponsor mirrors that
 * convention when no `existingCosponsoredProposal` is set, so subsequent
 * mints produce the same hash.
 *
 * Returns `null` when the action data isn't sufficient to build the
 * governance action (e.g. a HardFork card with no version data, or a
 * TreasuryWithdrawal with no beneficiaries). Caller falls back to using
 * `sourceUrlId` directly as `proposal.id`.
 */

import { BROWSER_CONFIG, computeProposalAssetName } from '@sundaeswap/cosponsor-sdk/browser'
import type { ICosponsoredProposal } from '@sundaeswap/cosponsor-sdk/validators'
import { buildGovernanceAction, mapCategoryToActionKind } from '@/lib/cardano/governanceActions'
import { proposalAnchorUrl } from '@/lib/cardano/proposalAnchor'
import { getCachedGovActionDepositLovelace } from '@/composables/useGovActionDeposit'
import { logger } from '@/lib/logger'
import type { IProposalCardData } from '@/types/Proposal'

// Conway gov_action_deposit on preview & mainnet (100k ADA). Used when the
// live cache hasn't filled yet — see useGovActionDeposit. The value is the
// protocol parameter, not a heuristic, so falling back to it produces the
// correct on-chain identity. If the parameter changes via governance, the
// cached value will be authoritative by the time it matters.
const FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE = 100_000_000_000n

interface IProposalIdentityInputs {
  sourceUrlId: string
  categoryName: string
  card: Pick<
    IProposalCardData,
    | 'withdrawals'
    | 'hardForkVersion'
    | 'constitutionHash'
    | 'constitutionUrl'
    | 'metadataUrl'
    | 'metadataHash'
  >
}

/**
 * Single source of truth for the on-chain anchor every mint/identity path
 * must derive identically (it is hashed into the gADA token name).
 *
 * Preferred: the BE-served CIP-108 metadata document (`metadataUrl` +
 * blake2b-256 of its exact bytes) so explorers can fetch + verify real
 * governance metadata for UI-submitted actions.
 *
 * Legacy fallback (cards without BE metadata — e.g. kept-around demo
 * generations whose pools were pledged before this existed): the SPA route
 * URL + padded pseudo-hash. Changing a card's convention changes its
 * procedure hash and orphans existing pledges — which is exactly why the BE
 * omits the metadata fields for legacy entries.
 */
export const deriveProposalAnchor = (
  sourceUrlId: string,
  metadataUrl?: string,
  metadataHash?: string
): { url: string; hash: string } => {
  if (metadataUrl && metadataHash && /^[0-9a-fA-F]{64}$/.test(metadataHash)) {
    return {
      url: Buffer.from(metadataUrl).toString('hex'),
      hash: metadataHash.toLowerCase(),
    }
  }
  return {
    url: Buffer.from(proposalAnchorUrl(sourceUrlId)).toString('hex'),
    hash: sourceUrlId.padEnd(64, '0').slice(0, 64),
  }
}

export interface IProposalIdentity {
  proposalHash: string
  cosponsoredProposal: ICosponsoredProposal
}

/**
 * Build the cosponsoredProposal a hypothetical first-time sponsor would mint
 * for this proposal, and compute its on-chain gADA token hash. Returns null
 * if the action data on the card is incomplete (we don't make up data — the
 * caller falls back to using `sourceUrlId` as a routing-only id).
 */
export const computeProposalIdentity = (
  inputs: IProposalIdentityInputs
): IProposalIdentity | null => {
  const { sourceUrlId, categoryName, card } = inputs

  let actionKind: string
  try {
    actionKind = mapCategoryToActionKind(categoryName)
  } catch (error) {
    logger.warn(
      `[proposalIdentity] unknown category "${categoryName}" — falling back to source id`,
      error
    )
    return null
  }

  let action
  try {
    action = buildGovernanceAction(actionKind, card as IProposalCardData)
  } catch (error) {
    logger.debug(
      `[proposalIdentity] cannot build action for ${actionKind} (${sourceUrlId}): ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return null
  }

  const deposit = getCachedGovActionDepositLovelace() ?? FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE

  // Anchor via the shared derivation (BE metadata anchor when present,
  // legacy sourceUrlId convention otherwise). ModalSponsor/ModalPropose use
  // the same helper so every path hashes the identical procedure.
  const anchor = deriveProposalAnchor(sourceUrlId, card.metadataUrl, card.metadataHash)

  const cosponsoredProposal: ICosponsoredProposal = {
    deposit,
    anchor,
    action,
  }

  try {
    const proposalHash = computeProposalAssetName(
      cosponsoredProposal,
      BROWSER_CONFIG.scripts.cosponsor.hash
    )
    return { proposalHash, cosponsoredProposal }
  } catch (error) {
    logger.warn(`[proposalIdentity] computeProposalAssetName threw for ${sourceUrlId}`, error)
    return null
  }
}
