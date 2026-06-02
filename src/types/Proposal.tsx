import type { ICosponsoredProposal } from '@sundaeswap/cosponsor-sdk/validators'

// Treasury withdrawal beneficiary data
export interface IProposalWithdrawal {
  receivingAddress: string
  amount: number // in lovelace
}

// Hard fork version data
export interface IHardForkVersion {
  major: number
  minor: number
}

// Data for the proposal overview cards.
export interface IProposalCardData {
  id: string
  name: string
  ownerId: string
  ownerName: string
  requestedBudget: number
  // The lovelace amount cosponsors are crowdfunding toward — i.e. the live
  // Conway gov_action_deposit protocol parameter (100,000 ADA on preview as
  // of 2026-05-21, fetched via useGovActionDeposit). Stored in ADA. Optional
  // so the data layer can render before the value loads.
  cosponsorTarget?: number
  pledgedAmount: number
  userPledged: number
  initDate: Date
  expiryDate: Date
  companyName: string
  companyDomain: string
  abstract: string
  categoryName: string
  // Optional: Treasury withdrawal beneficiaries (for TreasuryWithdrawal proposals)
  withdrawals?: IProposalWithdrawal[]
  // Optional: Hard fork version (for HardFork proposals)
  hardForkVersion?: IHardForkVersion
  // Optional: Constitution data (for NewConstitution proposals)
  constitutionHash?: string
  constitutionUrl?: string
  // Optional: SDK procedure recovered from an existing on-chain deposit for
  // this proposal. When set, the Sponsor flow re-uses it verbatim so the new
  // deposit produces the SAME on-chain procedure hash (= same gADA token)
  // and aggregates into the existing pledge instead of minting a new token
  // under a slightly-different procedure. Only set for cards built from
  // on-chain deposits (Your Pledges).
  existingCosponsoredProposal?: ICosponsoredProposal
  // Optional: on-chain proposal hash (= gADA token asset name) for cards
  // built from on-chain deposits. Used as a stable React key to prevent
  // collisions when two deposits resolve to the same display id.
  proposalHash?: string
  // The original source-side id (mock category id, GovTools numeric id, …)
  // used to build the on-chain anchor URL when this card was first
  // constructed. Threaded so ModalSponsor can produce the exact same
  // procedure (and therefore the same gADA token) when no
  // `existingCosponsoredProposal` is set. Without it the anchor URL would
  // depend on `id`, which becomes the computed hash post Stage-2 — a
  // circular dependency.
  sourceUrlId?: string
}

// Data for the individual Proposal page to view details.
export interface IProposalDetailsData extends IProposalCardData {
  companyCountry: string
  motivation: string
  rationale: string
  govActionId: string
  cip129ActionId: string
  pledges: IPledgeData[]
}

export interface IPledgeData {
  id: string
  ownerName: string
  amount: number
}
