export interface iProposalCardData {
  id: string
  name: string
  ownerId: string
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

export interface iProposalDetailsData extends iProposalCardData {
  companyCountry: string
  motivation: string
  rationale: string
  govActionId: string
  cip129ActionId: string
  pledgesIds: string[]
}
