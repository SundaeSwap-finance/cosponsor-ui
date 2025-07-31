// Data for the proposal overview cards.
export interface iProposalCardData {
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
}

// Data for the individual Proposal page to view details.
export interface iProposalDetailsData extends iProposalCardData {
  companyCountry: string
  motivation: string
  rationale: string
  govActionId: string
  cip129ActionId: string
  pledges: iPledgeData[]
}

export interface iPledgeData {
  id: string
  ownerName: string
  amount: number
}
