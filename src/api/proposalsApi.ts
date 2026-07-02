/**
 * Proposals API Service
 *
 * Fetches proposals from the cosponsor-api backend with lazy loading
 * and local caching for reliability and performance.
 */

import { cosponsorApi } from '@/api/cosponsorApi'
import { IProposalEnvelope, TProposalsListResponse } from '@/types/ProposalApi'
import { IProposalCardData, IProposalDetailsData } from '@/types/Proposal'
import { getCachedGovActionDepositAda } from '@/composables/useGovActionDeposit'
import { computeProposalIdentity } from '@/lib/cardano/proposalIdentity'
import { encodeCip129GovActionId } from '@/lib/cardano/cip129'
import { logger } from '@/lib/logger'

// Pagination result type for lazy loading
export interface IPaginatedProposals {
  proposals: IProposalCardData[]
  hasMore: boolean
  total: number
  nextStart: number
}

// In-memory cache
let cachedProposals: IProposalEnvelope[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_PAGE_SIZE = 20

// De-dupes concurrent callers made before the cache above is populated —
// e.g. the "all proposals" page mounts one CarouselProposals per category,
// each of which calls this on mount in the same tick. Without this, every
// one of them would see an empty cache and independently page through
// /proposals.
let inFlightFetch: Promise<IProposalEnvelope[]> | undefined

/**
 * Fetch all proposals from the API with pagination
 */
export const fetchAllProposals = async (limit: number = 100): Promise<IProposalEnvelope[]> => {
  // Check cache
  if (cachedProposals && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedProposals
  }

  if (inFlightFetch) {
    return inFlightFetch
  }

  inFlightFetch = (async () => {
    const allProposals: IProposalEnvelope[] = []
    let start = 0
    let hasMore = true

    while (hasMore) {
      try {
        const response = await cosponsorApi.get<TProposalsListResponse>('/proposals', {
          params: {
            'pagination[start]': start,
            'pagination[limit]': limit,
          },
        })

        const { data, meta } = response.data
        allProposals.push(...data)

        // Check if there are more pages
        const totalFetched = start + data.length
        hasMore = totalFetched < meta.pagination.total && data.length === limit
        start = totalFetched

        // Safety limit to prevent infinite loops and unnecessary load
        if (allProposals.length >= 100) {
          logger.warn('Reached safety limit of 100 proposals')
          hasMore = false
        }
      } catch (error) {
        logger.warn('Failed to fetch proposals from the API:', error)
        hasMore = false
      }
    }

    // Update cache
    cachedProposals = allProposals
    cacheTimestamp = Date.now()

    return allProposals
  })()

  try {
    return await inFlightFetch
  } finally {
    inFlightFetch = undefined
  }
}

/**
 * Fetch a single page of proposals from the API (for lazy loading)
 * Returns transformed IProposalCardData with pagination info
 *
 * NOTE: This does NOT support category filtering - use getProposalsByCategory for that
 */
export const fetchProposalsPage = async (
  start: number = 0,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<IPaginatedProposals> => {
  try {
    const response = await cosponsorApi.get<TProposalsListResponse>('/proposals', {
      params: {
        'pagination[start]': start,
        'pagination[limit]': limit,
      },
    })

    const { data, meta } = response.data

    // Filter out drafts
    const filteredData = data.filter((p) => !p.attributes.content?.attributes?.is_draft)

    // Transform to card format
    const proposals = filteredData.map(transformToProposalCard)

    // Calculate if there are more pages
    const totalFetched = start + data.length
    const hasMore = totalFetched < meta.pagination.total && data.length === limit

    return {
      proposals,
      hasMore,
      total: meta.pagination.total,
      nextStart: totalFetched,
    }
  } catch (error) {
    logger.warn('Failed to fetch proposals page from the API:', error)

    return {
      proposals: [],
      hasMore: false,
      total: 0,
      nextStart: start,
    }
  }
}

/**
 * Get proposals by category with client-side pagination
 * Fetches all proposals once (cached, mocks injected by getAllProposalsAsCards),
 * then paginates the filtered results.
 */
export const getProposalsByCategoryPaginated = async (
  categoryName: string,
  start: number = 0,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<IPaginatedProposals> => {
  const allProposals = await getAllProposalsAsCards()

  const filtered = allProposals.filter(
    (p) => p.categoryName.toLowerCase() === categoryName.toLowerCase()
  )

  const paginatedProposals = filtered.slice(start, start + limit)

  return {
    proposals: paginatedProposals,
    hasMore: start + limit < filtered.length,
    total: filtered.length,
    nextStart: start + limit,
  }
}

/**
 * Fetch a single proposal by ID from the API
 */
export const fetchProposalById = async (id: string | number): Promise<IProposalEnvelope | null> => {
  try {
    const response = await cosponsorApi.get<{ data: IProposalEnvelope }>(`/proposals/${id}`)
    return response.data.data
  } catch (error) {
    logger.warn(`Failed to fetch proposal ${id} from the API:`, error)
    return null
  }
}

/**
 * Transform an API proposal envelope to CoSponsor card format
 */
export const transformToProposalCard = (proposal: IProposalEnvelope): IProposalCardData => {
  const attrs = proposal.attributes
  const content = attrs.content?.attributes

  // Calculate a reasonable expiry date (90 days from creation for non-submitted proposals)
  const createdDate = new Date(content?.createdAt || attrs.createdAt)
  const expiryDate = new Date(createdDate)
  expiryDate.setDate(expiryDate.getDate() + 90)

  // Transform treasury withdrawal beneficiaries if present
  const withdrawals = content?.proposal_withdrawals?.map((w) => ({
    receivingAddress: w.receiving_address,
    amount: w.withdrawal_amount,
  }))

  // Extract hard fork version if present
  const hardForkContent = content?.proposal_hard_fork_content
  const hardForkVersion = hardForkContent
    ? { major: hardForkContent.major, minor: hardForkContent.minor }
    : undefined

  // Extract constitution data if present
  const constitutionContent = content?.proposal_constitution_content
  const constitutionHash = constitutionContent?.constitution_hash || undefined
  const constitutionUrl = constitutionContent?.constitution_url || undefined

  const sourceUrlId = String(proposal.id)
  const categoryName = content?.gov_action_type?.attributes?.gov_action_type_name || 'Info Action'

  // Identity = on-chain gADA token hash (same as what ModalSponsor would
  // mint). Falls back to `sourceUrlId` when the action data is incomplete
  // — the card is still routable, just without on-chain hash alignment.
  const identity = computeProposalIdentity({
    sourceUrlId,
    categoryName,
    card: {
      withdrawals: withdrawals?.length ? withdrawals : undefined,
      hardForkVersion,
      constitutionHash,
      constitutionUrl,
    },
  })

  return {
    id: identity?.proposalHash ?? sourceUrlId,
    name: content?.prop_name || `Proposal #${proposal.id}`,
    ownerId: attrs.user_id,
    ownerName: attrs.user_govtool_username || 'Anonymous',
    // CoSponsor-specific fields (not from the API)
    requestedBudget: 0, // Will be populated from CoSponsor backend
    // Live Conway gov_action_deposit (what cosponsors crowdfund toward).
    // Filled in by useGetProposalData when the hook value lands; default
    // here is undefined so the progress UI hides until it's known.
    cosponsorTarget: getCachedGovActionDepositAda() ?? undefined,
    pledgedAmount: 0, // Will be populated from CoSponsor backend
    userPledged: 0, // Will be populated from wallet data
    initDate: createdDate,
    expiryDate: expiryDate,
    companyName: content?.gov_action_type?.attributes?.gov_action_type_name || 'Unknown',
    companyDomain: '', // Not available from the API
    abstract: content?.prop_abstract || 'No abstract available.',
    categoryName,
    // Treasury withdrawal beneficiaries (for TreasuryWithdrawal proposals)
    withdrawals: withdrawals?.length ? withdrawals : undefined,
    // Hard fork version (for HardFork proposals)
    hardForkVersion,
    // Constitution data (for NewConstitution proposals)
    constitutionHash,
    constitutionUrl,
    sourceUrlId,
    existingCosponsoredProposal: identity?.cosponsoredProposal,
  }
}

/**
 * Transform an API proposal envelope to CoSponsor details format
 */
export const transformToProposalDetails = (proposal: IProposalEnvelope): IProposalDetailsData => {
  const baseCard = transformToProposalCard(proposal)
  const content = proposal.attributes.content?.attributes

  const submissionTxHash = content?.prop_submission_tx_hash || ''

  return {
    ...baseCard,
    companyCountry: '', // Not available from the API
    motivation: content?.prop_motivation || 'No motivation provided.',
    rationale: content?.prop_rationale || 'No rationale provided.',
    govActionId: submissionTxHash,
    // CIP-129 bech32 id, derived from the submission tx hash. Empty (and the
    // detail page hides the row) until the proposal has actually been
    // submitted on-chain. See encodeCip129GovActionId for the index-0 note.
    cip129ActionId: encodeCip129GovActionId(submissionTxHash),
    pledges: [], // Would come from CoSponsor backend
  }
}

/**
 * Get all proposals as CoSponsor card format. This is the canonical list:
 * any consumer that needs to look up a proposal by id (URL routing, on-chain
 * deposit → proposal matching, etc.) should go through here so the lookup is
 * sound and not duplicated across call sites.
 *
 * Categories with no real proposals yet get a "[TEST]" example proposal
 * injected server-side (see cosponsor-api's demo.go) so every category
 * stays browsable/testable — no client-side mock generation needed here.
 */
export const getAllProposalsAsCards = async (): Promise<IProposalCardData[]> => {
  try {
    const proposals = await fetchAllProposals()
    return proposals
      .filter((p) => !p.attributes.content?.attributes?.is_draft)
      .map(transformToProposalCard)
  } catch (error) {
    console.error('Failed to get proposals:', error)
    return []
  }
}

/**
 * Get proposal details by ID. Looks up the matching envelope from the
 * already-cached full proposal list (shared with getAllProposalsAsCards
 * via fetchAllProposals's cache) so real and server-injected demo entries
 * go through the same path with no extra round trip. Falls back to a
 * direct by-id fetch if the id isn't in the cached list (e.g. very new
 * proposal not yet cached).
 */
export const getProposalDetailsById = async (id: string): Promise<IProposalDetailsData | null> => {
  const allProposals = await getAllProposalsAsCards()
  // Routes use the on-chain proposal hash post Stage-2, but legacy routes
  // pointing at the pre-Stage-2 source id should still resolve to the same
  // card — match against either.
  const card = allProposals.find((p) => p.id === id || p.sourceUrlId === id)

  if (card) {
    const envelopes = await fetchAllProposals()
    const envelope = envelopes.find((e) => String(e.id) === card.sourceUrlId)
    if (envelope) {
      return transformToProposalDetails(envelope)
    }
    // Not in the cached envelope list (rare) — direct fetch by id.
    const lookupId = card.sourceUrlId ?? card.id
    const proposal = await fetchProposalById(lookupId)
    return proposal ? transformToProposalDetails(proposal) : null
  }

  const proposal = await fetchProposalById(id)
  return proposal ? transformToProposalDetails(proposal) : null
}

/**
 * Filter proposals by governance action type.
 * Mocks are already included via getAllProposalsAsCards.
 */
export const getProposalsByCategory = async (
  categoryName: string
): Promise<IProposalCardData[]> => {
  const allProposals = await getAllProposalsAsCards()
  return allProposals.filter((p) => p.categoryName.toLowerCase() === categoryName.toLowerCase())
}

/**
 * Clear the in-memory cache (useful for forcing a refresh)
 */
export const clearProposalsCache = (): void => {
  cachedProposals = null
  cacheTimestamp = 0
}
