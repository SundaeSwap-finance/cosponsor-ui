/**
 * GovTools Proposals API Service
 *
 * Fetches proposals from the GovTools Proposal Pillar API with lazy loading
 * and local caching for reliability and performance.
 */

import { govToolsApi } from '@/api/govToolsApi'
import { IGovToolsProposal, TGovToolsProposalsListResponse } from '@/types/GovToolsApi'
import { IProposalCardData, IProposalDetailsData } from '@/types/Proposal'
import { getCachedGovActionDepositAda } from '@/composables/useGovActionDeposit'
import { computeProposalIdentity } from '@/lib/cardano/proposalIdentity'
import { encodeCip129GovActionId } from '@/lib/cardano/cip129'
import { setUsingBackupData } from '@/lib/dataSourceStatus'
import { logger } from '@/lib/logger'

// Import backup data as fallback
import backupData from '@/data/govtools-proposals-backup.json'

// Pagination result type for lazy loading
export interface IPaginatedProposals {
  proposals: IProposalCardData[]
  hasMore: boolean
  total: number
  nextStart: number
}

// In-memory cache
let cachedProposals: IGovToolsProposal[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_PAGE_SIZE = 20

/**
 * Fetch all proposals from GovTools API with pagination
 * Falls back to local backup data if API is unavailable
 */
export const fetchAllGovToolsProposals = async (
  limit: number = 100
): Promise<IGovToolsProposal[]> => {
  // Check cache
  if (cachedProposals && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedProposals
  }

  const allProposals: IGovToolsProposal[] = []
  let start = 0
  let hasMore = true
  let apiAvailable = true

  while (hasMore && apiAvailable) {
    try {
      const response = await govToolsApi.get<TGovToolsProposalsListResponse>('/proposals', {
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
      logger.warn('Failed to fetch proposals from GovTools API, using backup data:', error)
      apiAvailable = false
    }
  }

  // If API failed or returned no data, use backup
  if (allProposals.length === 0) {
    logger.warn('Using local backup data for proposals')
    const backup = backupData as TGovToolsProposalsListResponse
    allProposals.push(...backup.data)
    setUsingBackupData(true)
  } else {
    setUsingBackupData(false)
  }

  // Update cache
  cachedProposals = allProposals
  cacheTimestamp = Date.now()

  return allProposals
}

/**
 * Fetch a single page of proposals from GovTools API (for lazy loading)
 * Returns transformed IProposalCardData with pagination info
 *
 * NOTE: This does NOT support category filtering - use getProposalsByCategory for that
 */
export const fetchProposalsPage = async (
  start: number = 0,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<IPaginatedProposals> => {
  try {
    const response = await govToolsApi.get<TGovToolsProposalsListResponse>('/proposals', {
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

    setUsingBackupData(false)
    return {
      proposals,
      hasMore,
      total: meta.pagination.total,
      nextStart: totalFetched,
    }
  } catch (error) {
    logger.warn('Failed to fetch proposals page from GovTools API:', error)

    // Fallback to backup data for first page
    if (start === 0) {
      setUsingBackupData(true)
      const backup = backupData as TGovToolsProposalsListResponse
      const backupProposals = backup.data.filter((p) => !p.attributes.content?.attributes?.is_draft)

      const proposals = backupProposals.slice(0, limit).map(transformToProposalCard)
      return {
        proposals,
        hasMore: backupProposals.length > limit,
        total: backupProposals.length,
        nextStart: limit,
      }
    }

    // No data for subsequent pages on error
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
 * Fetch a single proposal by ID from GovTools API
 */
export const fetchGovToolsProposalById = async (
  id: string | number
): Promise<IGovToolsProposal | null> => {
  try {
    const response = await govToolsApi.get<{ data: IGovToolsProposal }>(`/proposals/${id}`)
    return response.data.data
  } catch (error) {
    logger.warn(`Failed to fetch proposal ${id} from GovTools API:`, error)
    return null
  }
}

/**
 * Transform GovTools proposal to CoSponsor card format
 */
export const transformToProposalCard = (govProposal: IGovToolsProposal): IProposalCardData => {
  const attrs = govProposal.attributes
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

  const sourceUrlId = String(govProposal.id)
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
    name: content?.prop_name || `Proposal #${govProposal.id}`,
    ownerId: attrs.user_id,
    ownerName: attrs.user_govtool_username || 'Anonymous',
    // CoSponsor-specific fields (not in GovTools)
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
    companyDomain: '', // Not available from GovTools
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
 * Transform GovTools proposal to CoSponsor details format
 */
export const transformToProposalDetails = (
  govProposal: IGovToolsProposal
): IProposalDetailsData => {
  const baseCard = transformToProposalCard(govProposal)
  const content = govProposal.attributes.content?.attributes

  const submissionTxHash = content?.prop_submission_tx_hash || ''

  return {
    ...baseCard,
    companyCountry: '', // Not available from GovTools
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
 * Categories that get an injected mock proposal for testing. Pre-production
 * scaffolding — remove `MOCK_CATEGORIES` and the spread in
 * `getAllProposalsAsCards` once the GovTools BE is live and we no longer
 * need synthetic proposals to exercise the deposit/withdraw flows.
 */
const MOCK_CATEGORIES = [
  'Info Action',
  'Treasury Withdrawal',
  'Protocol Parameters',
  'Hard Fork',
  'No Confidence',
  'Constitutional Committee',
  'New Constitution',
]

/**
 * Get all proposals as CoSponsor card format. This is the canonical list:
 * any consumer that needs to look up a proposal by id (URL routing, on-chain
 * deposit → proposal matching, etc.) should go through here so the lookup is
 * sound and not duplicated across call sites.
 */
export const getAllProposalsAsCards = async (): Promise<IProposalCardData[]> => {
  const mockCards = MOCK_CATEGORIES.map((cat) => createMockProposal(cat))

  try {
    const govProposals = await fetchAllGovToolsProposals()
    const realCards = govProposals
      .filter((p) => !p.attributes.content?.attributes?.is_draft)
      .map(transformToProposalCard)
    return [...mockCards, ...realCards]
  } catch (error) {
    console.error('Failed to get proposals:', error)
    return mockCards
  }
}

// Mock proposal for testing (expires 30 days from now)
// ID must be a valid 64-char hex string for transaction building
const MOCK_PROPOSAL_ID_PREFIX = 'deadbeef0000000000000000000000000000000000000000000000000000'

/**
 * Generate a mock proposal ID for a category
 * Each category gets a unique ID based on its name hash
 */
const getMockProposalId = (categoryName: string): string => {
  // Simple hash of category name to create unique suffix
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash << 5) - hash + categoryName.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  const suffix = Math.abs(hash).toString(16).padStart(4, '0').slice(0, 4)
  return MOCK_PROPOSAL_ID_PREFIX + suffix
}

/**
 * Create a mock proposal for any category
 * Includes test data appropriate for each governance action type
 */
export const createMockProposal = (categoryName: string): IProposalCardData => {
  const normalizedCategory = categoryName.toLowerCase()

  // Check category types
  const isTreasury =
    normalizedCategory.includes('treasury') || normalizedCategory.includes('withdrawal')
  const isHardFork =
    normalizedCategory.includes('hard fork') || normalizedCategory.includes('hardfork')
  const isConstitution =
    normalizedCategory.includes('constitution') && !normalizedCategory.includes('committee')
  const isNoConfidence = normalizedCategory.includes('no confidence')

  const sourceUrlId = getMockProposalId(categoryName)

  // Base mock proposal — `id` is filled in below after computing the
  // on-chain hash from the full procedure data. We thread `sourceUrlId`
  // separately so ModalSponsor can rebuild the same anchor URL.
  const baseProposal: IProposalCardData = {
    id: sourceUrlId,
    sourceUrlId,
    name: `[TEST] Sample ${categoryName} Proposal`,
    ownerId: 'test-owner-123',
    ownerName: 'Test User',
    requestedBudget: 50000,
    // Surface the live Conway gov_action_deposit if it's been fetched. This
    // is what cosponsors are crowdfunding toward; useGovActionDeposit loads it
    // at app start. Falls back to undefined (UI will hide the progress bar)
    // when the param hasn't resolved yet.
    cosponsorTarget: getCachedGovActionDepositAda() ?? undefined,
    pledgedAmount: 0,
    userPledged: 0,
    initDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    companyName: categoryName,
    companyDomain: 'test.cosponsor.io',
    abstract: `This is a mock ${categoryName} proposal for testing the CoSponsor platform. It has a future expiry date so you can test sponsoring and withdrawing.`,
    categoryName: categoryName,
  }

  // Add type-specific test data
  if (isTreasury) {
    // Treasury Withdrawal test data
    baseProposal.withdrawals = [
      {
        // Test address on Preview testnet (enterprise address)
        receivingAddress:
          'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
        amount: 50000000000, // 50,000 ADA in lovelace
      },
    ]
  } else if (isHardFork) {
    // Hard Fork test data (next version after current Chang era)
    baseProposal.hardForkVersion = {
      major: 10,
      minor: 0,
    }
  } else if (isConstitution) {
    // New Constitution test data
    baseProposal.constitutionUrl = 'https://constitution.gov.cardano.org/test-constitution.json'
    // Sample 64-char hex hash
    baseProposal.constitutionHash =
      'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
  } else if (isNoConfidence) {
    // No Confidence doesn't need extra data (just ancestor which defaults to null)
  }
  // Note: ProtocolParameters and ConstitutionalCommittee don't need extra data
  // as they use empty/default test values (no parameter changes, no member changes)

  const identity = computeProposalIdentity({
    sourceUrlId,
    categoryName,
    card: baseProposal,
  })
  if (identity) {
    baseProposal.id = identity.proposalHash
    baseProposal.existingCosponsoredProposal = identity.cosponsoredProposal
  }

  return baseProposal
}

/**
 * Check if a card was built from the mock factory.
 *
 * Post Stage-2 the routable `proposal.id` is the on-chain gADA token hash,
 * which carries no "mock" marker. The original mock-prefixed id lives on
 * the card as `sourceUrlId` — that's what we check here.
 */
export const isMockProposalCard = (card: IProposalCardData): boolean => {
  return !!card.sourceUrlId?.startsWith(MOCK_PROPOSAL_ID_PREFIX)
}

/**
 * Extract category name from a mock proposal's `sourceUrlId`. Returns null
 * when the id doesn't belong to any of the known mock categories — caller
 * decides on a fallback (the previous default of "Info Action" silently
 * hid bugs in lookups).
 */
export const getCategoryFromMockSourceUrlId = (sourceUrlId: string): string | null => {
  for (const cat of MOCK_CATEGORIES) {
    if (getMockProposalId(cat) === sourceUrlId) {
      return cat
    }
  }
  return null
}

/**
 * Get proposal details by ID. Looks up via the unified proposal list first
 * (so mocks and GovTools entries go through the same code path); falls back
 * to a fresh GovTools fetch if the id isn't in the list (e.g. very new
 * proposal not yet in the cache).
 */
export const getProposalDetailsById = async (id: string): Promise<IProposalDetailsData | null> => {
  const allProposals = await getAllProposalsAsCards()
  // Routes use the on-chain proposal hash post Stage-2, but legacy routes
  // pointing at the pre-Stage-2 source id should still resolve to the same
  // card — match against either.
  const card = allProposals.find((p) => p.id === id || p.sourceUrlId === id)

  if (card) {
    if (isMockProposalCard(card)) {
      const categoryName =
        getCategoryFromMockSourceUrlId(card.sourceUrlId ?? '') ?? card.categoryName
      return {
        ...card,
        companyCountry: 'Testland',
        motivation: `This mock ${categoryName} proposal demonstrates the CoSponsor platform functionality. Use it to test depositing and withdrawing ADA.`,
        rationale:
          'Testing is essential to ensure the platform works correctly before mainnet launch.',
        govActionId: card.id,
        // Mock proposals have no real on-chain submission tx, so there's no
        // valid CIP-129 id to show — leave empty (row hides) rather than
        // echoing the gADA hash, which isn't a governance action id.
        cip129ActionId: '',
        pledges: [],
      }
    }
    // Real GovTools card: re-fetch full details by the source id.
    const lookupId = card.sourceUrlId ?? card.id
    const proposal = await fetchGovToolsProposalById(lookupId)
    return proposal ? transformToProposalDetails(proposal) : null
  }

  const proposal = await fetchGovToolsProposalById(id)
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
