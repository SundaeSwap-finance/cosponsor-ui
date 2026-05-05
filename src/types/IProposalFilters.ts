export interface IProposalFilters {
  status?: string[]
  budget?: [number, number]
  fundProgress?: [number, number]
  expiration?: [Date | undefined, Date | undefined]
}
