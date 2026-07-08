/**
 * cosponsor-api Proposal Response Types
 *
 * These types represent the response structure from the cosponsor-api
 * backend's `/proposals` endpoints. The envelope shape mirrors
 * `backend/functions/server/govtools_shape.go` byte-for-byte.
 */

// ============================================================================
// API Response Wrapper Types
// ============================================================================

export interface IPaginatedResponse<T> {
  data: T[]
  meta: {
    pagination: {
      start: number
      limit: number
      total: number
    }
  }
}

export interface ISingleResponse<T> {
  data: T
}

// ============================================================================
// Core Entity Types
// ============================================================================

export interface IGovActionType {
  id: number
  attributes: {
    gov_action_type_name: string
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

export interface IProposalLink {
  id: number
  prop_link: string
  prop_link_text: string
}

export interface IProposalWithdrawalRecord {
  id: number
  withdrawal_amount: number
  receiving_address: string
}

export interface IConstitutionContent {
  id: number
  constitution_url: string
  constitution_hash: string
}

export interface IHardForkContent {
  id: number
  major: number
  minor: number
}

// ============================================================================
// Proposal Content Types
// ============================================================================

export interface IProposalContentAttributes {
  proposal_id: string
  prop_rev_active: boolean
  prop_abstract: string
  prop_motivation: string
  prop_rationale: string
  gov_action_type_id: string
  prop_name: string
  is_draft: boolean
  user_id: string
  prop_submitted: boolean
  prop_submission_tx_hash: string | null
  prop_submission_date: string | null
  createdAt: string
  updatedAt: string
  is_locked: boolean | null
  proposal_links: IProposalLink[]
  proposal_withdrawals: IProposalWithdrawalRecord[]
  proposal_constitution_content: IConstitutionContent | null
  proposal_hard_fork_content: IHardForkContent | null
  gov_action_type: IGovActionType
  // BE-served CIP-108 anchor: metadata document URL + blake2b-256 of its
  // exact bytes. Absent for legacy entries pledged under the old
  // sourceUrlId anchor convention.
  prop_metadata_url?: string
  prop_metadata_hash?: string
}

export interface IProposalContent {
  id: number
  attributes: IProposalContentAttributes
}

// ============================================================================
// Full Proposal Types
// ============================================================================

export interface IProposalAttributes {
  prop_likes: number
  prop_dislikes: number
  prop_comments_number: number
  user_id: string
  createdAt: string
  updatedAt: string
  user_govtool_username: string
  content: IProposalContent
}

export interface IProposalEnvelope {
  id: number
  attributes: IProposalAttributes
}

// ============================================================================
// API Response Aliases (for convenience)
// ============================================================================

export type TProposalsListResponse = IPaginatedResponse<IProposalEnvelope>
export type TProposalResponse = ISingleResponse<IProposalEnvelope>

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface IProposalListParams {
  'pagination[limit]'?: number
  'pagination[start]'?: number
  'pagination[page]'?: number
  'pagination[pageSize]'?: number
  sort?: string
  populate?: string
  filters?: string
}
