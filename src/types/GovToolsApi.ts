/**
 * GovTools Proposal Pillar API Types
 *
 * These types represent the response structure from the GovTools API:
 * - Mainnet: https://be.pdf.gov.tools/api/
 * - Preview: https://p1337-zdae9891f-zf09d11da-gtw.z937eb260.rustrocks.fr/api/
 *
 * Documentation: https://docs.gov.tools/participate-in-development/govtool-apis/proposal-pillar-api/access
 */

// ============================================================================
// API Response Wrapper Types
// ============================================================================

export interface IGovToolsPaginatedResponse<T> {
  data: T[]
  meta: {
    pagination: {
      start: number
      limit: number
      total: number
    }
  }
}

export interface IGovToolsSingleResponse<T> {
  data: T
}

// ============================================================================
// Core Entity Types
// ============================================================================

export interface IGovToolsGovActionType {
  id: number
  attributes: {
    gov_action_type_name: string
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

export interface IGovToolsProposalLink {
  id: number
  prop_link: string
  prop_link_text: string
}

export interface IGovToolsProposalWithdrawal {
  id: number
  withdrawal_amount: number
  receiving_address: string
}

export interface IGovToolsConstitutionContent {
  id: number
  constitution_url: string
  constitution_hash: string
}

export interface IGovToolsHardForkContent {
  id: number
  major: number
  minor: number
}

// ============================================================================
// Proposal Content Types
// ============================================================================

export interface IGovToolsProposalContentAttributes {
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
  proposal_links: IGovToolsProposalLink[]
  proposal_withdrawals: IGovToolsProposalWithdrawal[]
  proposal_constitution_content: IGovToolsConstitutionContent | null
  proposal_hard_fork_content: IGovToolsHardForkContent | null
  gov_action_type: IGovToolsGovActionType
}

export interface IGovToolsProposalContent {
  id: number
  attributes: IGovToolsProposalContentAttributes
}

// ============================================================================
// Full Proposal Types
// ============================================================================

export interface IGovToolsProposalAttributes {
  prop_likes: number
  prop_dislikes: number
  prop_comments_number: number
  user_id: string
  createdAt: string
  updatedAt: string
  user_govtool_username: string
  content: IGovToolsProposalContent
}

export interface IGovToolsProposal {
  id: number
  attributes: IGovToolsProposalAttributes
}

// ============================================================================
// API Response Aliases (for convenience)
// ============================================================================

export type TGovToolsProposalsListResponse = IGovToolsPaginatedResponse<IGovToolsProposal>
export type TGovToolsProposalResponse = IGovToolsSingleResponse<IGovToolsProposal>

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface IGovToolsListParams {
  'pagination[limit]'?: number
  'pagination[start]'?: number
  'pagination[page]'?: number
  'pagination[pageSize]'?: number
  sort?: string
  populate?: string
  filters?: string
}
