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
    'withdrawals' | 'hardForkVersion' | 'constitutionHash' | 'constitutionUrl'
  >
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

  // Anchor URL uses `sourceUrlId`, NOT `proposal.id` — the latter is what
  // we're about to compute. ModalSponsor mirrors this convention.
  const anchorUrlHex = Buffer.from(proposalAnchorUrl(sourceUrlId)).toString('hex')
  const anchorHash = sourceUrlId.padEnd(64, '0').slice(0, 64)

  const cosponsoredProposal: ICosponsoredProposal = {
    deposit,
    anchor: { url: anchorUrlHex, hash: anchorHash },
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
