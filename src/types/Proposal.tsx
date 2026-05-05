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
