import { GovernanceAction } from '@sundaeswap/cosponsor-sdk/validators'
import { parseAddressToCredential } from '@sundaeswap/cosponsor-sdk/browser'
import { GUARDRAILS_SCRIPT_HASH } from '@sundaeswap/cosponsor-sdk/utils'
import { getCachedAncestorForKind } from '@/lib/cardano/ancestorsCache'
import { IProposalCardData } from '@/types/Proposal'

// Map UI category names to valid Aiken governance action kinds
// (keys are lowercase for case-insensitive matching)
export const CATEGORY_TO_ACTION_KIND: Record<string, string> = {
  'info action': 'NicePoll',
  'treasury withdrawal': 'TreasuryWithdrawal',
  treasurywithdrawals: 'TreasuryWithdrawal',
  'treasury requests': 'TreasuryWithdrawal',
  'protocol parameters': 'ProtocolParameters',
  'hard fork': 'HardFork',
  'no confidence': 'NoConfidence',
  'constitutional committee': 'ConstitutionalCommittee',
  'new constitution': 'NewConstitution',
  'updates to the constitution': 'NewConstitution',
  nicepoll: 'NicePoll',
}

// Governance action types users can cosponsor through the UI.
export const SUPPORTED_ACTION_TYPES = [
  'TreasuryWithdrawal', // Constructor 2: Treasury Withdrawal
  'NoConfidence', // Constructor 3: No Confidence Motion
  'ConstitutionalCommittee', // Constructor 4: Constitutional Committee Update
  'NicePoll', // Constructor 6: Info Action
]

// Types deliberately NOT offered for creation (parsing/display of existing
// on-chain proposals still works via CATEGORY_TO_ACTION_KIND +
// ACTION_TYPE_DISPLAY_NAMES).
// - HardFork: no product use case for user-initiated hard forks.
// - ProtocolParameters: the UI cannot source a real parameter-update map
//   from card data yet; an empty update is ledger-rejected
//   (MalformedProposal), so pledging toward an unsubmittable pool is worse
//   than gating. Re-enable once param values are threaded through.
// - NewConstitution: the propose step needs the constitution document
//   anchor (SDK `constitutionAnchor`), which the UI doesn't extract from
//   the proposal metadata yet — same unsubmittable-pool reasoning.
export const DISABLED_ACTION_TYPES = [
  'HardFork', // Constructor 1: Hard Fork Initiation
  'ProtocolParameters', // Constructor 0: Protocol Parameters Update
  'NewConstitution', // Constructor 5: New Constitution
]

// User-friendly names for governance action types
export const ACTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  NicePoll: 'Info Action',
  TreasuryWithdrawal: 'Treasury Withdrawal',
  ProtocolParameters: 'Protocol Parameters',
  HardFork: 'Hard Fork',
  NoConfidence: 'No Confidence',
  NewConstitution: 'New Constitution',
  ConstitutionalCommittee: 'Constitutional Committee',
}

// Map category name to action kind (case-insensitive)
export const mapCategoryToActionKind = (category: string): string => {
  const actionKind = CATEGORY_TO_ACTION_KIND[category.toLowerCase()]
  if (!actionKind) {
    throw new Error(
      `Unknown governance action category: "${category}". ` +
        `Valid categories: ${Object.keys(CATEGORY_TO_ACTION_KIND).join(', ')}`
    )
  }
  return actionKind
}

// Build governance action with proper data for the action type
export const buildGovernanceAction = (
  actionKind: string,
  proposal?: IProposalCardData
): GovernanceAction.TGovernanceAction => {
  // Check if action type is supported
  if (!SUPPORTED_ACTION_TYPES.includes(actionKind)) {
    const displayName = ACTION_TYPE_DISPLAY_NAMES[actionKind] || actionKind
    if (DISABLED_ACTION_TYPES.includes(actionKind)) {
      throw new Error(`${displayName} proposals are not currently supported for cosponsoring.`)
    }
    throw new Error(`Unknown governance action type: "${displayName}". Please report this issue.`)
  }

  switch (actionKind) {
    case 'ProtocolParameters': {
      // Constructor 0: Protocol Parameters Update
      // For testing: uses empty parameters (no changes proposed)
      return {
        kind: 'ProtocolParameters',
        ancestor: null,
      } as GovernanceAction.IProtocolParameters
    }

    case 'HardFork': {
      // Constructor 1: Hard Fork Initiation
      // Requires version from proposal.hardForkVersion
      if (!proposal?.hardForkVersion) {
        throw new Error(
          'Hard Fork proposals require version data. ' +
            'No version information found for this proposal.'
        )
      }

      return {
        kind: 'HardFork',
        ancestor: null, // No ancestor for new proposals
        version: {
          major: proposal.hardForkVersion.major,
          minor: proposal.hardForkVersion.minor,
        },
      } as GovernanceAction.IHardFork
    }

    case 'TreasuryWithdrawal': {
      // Constructor 2: Treasury Withdrawal
      // Requires beneficiaries from proposal.withdrawals
      if (!proposal?.withdrawals || proposal.withdrawals.length === 0) {
        throw new Error(
          'Treasury Withdrawal proposals require beneficiary data. ' +
            'No withdrawal beneficiaries found for this proposal.'
        )
      }

      // Build beneficiaries map from proposal withdrawals
      const beneficiaries = new Map<{ vkey: string } | { script: string }, bigint>()
      for (const withdrawal of proposal.withdrawals) {
        try {
          const credential = parseAddressToCredential(withdrawal.receivingAddress)
          beneficiaries.set(credential, BigInt(withdrawal.amount))
        } catch (error) {
          throw new Error(
            `Failed to parse beneficiary address: ${withdrawal.receivingAddress}. ` +
              `${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      return {
        kind: 'TreasuryWithdrawal',
        beneficiaries,
        // The ledger runs the enacted constitution's guardrails script for
        // every TreasuryWithdrawal and requires the action to name its hash
        // — `undefined` (Option::None) is rejected with
        // InvalidGuardrailsScriptHash on any network with a constitution.
        // The SDK propose builder witnesses the script automatically.
        guardRails: GUARDRAILS_SCRIPT_HASH,
      } as GovernanceAction.ITreasuryWithdrawal
    }

    case 'NoConfidence': {
      // Constructor 3: No Confidence Motion
      // The ancestor must be the currently-enacted Committee-purpose action
      // — a null ancestor is ledger-rejected (InvalidPrevGovActionId) and
      // burns the pooled gov deposit at submission. Resolved live via the
      // SDK/Koios and cached (throws while the cache is cold; user-action
      // paths await ensureAncestors() first).
      return {
        kind: 'NoConfidence',
        ancestor: getCachedAncestorForKind('NoConfidence'),
      } as GovernanceAction.INoConfidence
    }

    case 'ConstitutionalCommittee': {
      // Constructor 4: Constitutional Committee Update
      // For testing: empty member changes with 2/3 quorum. Ancestor: same
      // Committee purpose as NoConfidence (see above).
      return {
        kind: 'ConstitutionalCommittee',
        ancestor: getCachedAncestorForKind('ConstitutionalCommittee'),
        membersToRemove: [], // No members to remove
        membersToAdd: new Map(), // No members to add
        quorum: { numerator: 2n, denominator: 3n }, // 2/3 majority
      } as GovernanceAction.IConstitutionalCommittee
    }

    case 'NewConstitution': {
      // Constructor 5: New Constitution
      // The on-chain Constitution carries only `guardrails: Option<ScriptHash>`
      // (SDK audit H2) — constitutionHash/constitutionUrl are deprecated,
      // have no on-chain slot, and were always ignored by the SDK builder.
      // Requiring them here blocked pledges on GovTools proposals that lack
      // `proposal_constitution_content` for no on-chain reason, so they are
      // no longer required or passed. Omitting `guardrails` encodes
      // Option::None, byte-identical to the previous output — token hashes
      // for existing NewConstitution proposals are unaffected. If GovTools
      // ever exposes a guardrails script hash, thread it through
      // IProposalCardData and set it here.
      return {
        kind: 'NewConstitution',
        ancestor: null, // No ancestor for new proposals
      } as GovernanceAction.INewConstitution
    }

    case 'NicePoll': {
      // Constructor 6: Info Action (simplest - no data needed)
      return { kind: 'NicePoll' } as GovernanceAction.INicePoll
    }

    default: {
      throw new Error(`Unhandled governance action kind: ${actionKind}`)
    }
  }
}
