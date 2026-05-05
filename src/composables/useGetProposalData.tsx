import { IProposalCardData, IProposalDetailsData } from '@/types/Proposal'
import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'

import { useWalletObserver } from '@sundaeswap/wallet-lite'
import {
  createBlazeWithBrowserWallet,
  fetchUserDeposits,
  IUserDeposit,
} from '@sundaeswap/cosponsor-sdk/browser'
import {
  getAllProposalsAsCards,
  getProposalDetailsById as fetchProposalDetails,
  getProposalsByCategory,
  fetchProposalsPage,
  getProposalsByCategoryPaginated,
  IPaginatedProposals,
} from '@/api/govToolsProposals'

export const useGetProposalData = () => {
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer

  // Transform IUserDeposit to IProposalCardData
  // Optionally pass GovTools data to enrich the proposal with proper category info
  const transformDepositToProposal = useCallback(
    (deposit: IUserDeposit, govToolsData?: IProposalCardData): IProposalCardData => {
      // Calculate amounts in ADA
      const userPledgedAmountAda = Number(deposit.tokenAmount) / 1_000_000

      // For on-chain proposals, we use the token asset name (proposal hash) as the ID
      // This uniquely identifies the proposal and allows the details page to work
      const proposalHash = deposit.proposalHash || deposit.tokenAssetName

      // Use GovTools data if available, otherwise fallback to on-chain data
      // Replace "Unknown" or "Processed" with more user-friendly "On-chain Proposal"
      const actionKind = deposit.cosponsoredProposal.action.kind
      const needsFallback = actionKind === 'Unknown' || actionKind === 'Processed'
      const categoryName =
        govToolsData?.categoryName || (needsFallback ? 'On-chain Proposal' : actionKind)
      const companyName =
        govToolsData?.companyName || (needsFallback ? 'On-chain Proposal' : actionKind)

      return {
        id: govToolsData?.id || proposalHash,
        name: govToolsData?.name || `Proposal ${proposalHash.slice(0, 8)}...`,
        ownerId: govToolsData?.ownerId || proposalHash.slice(0, 16),
        ownerName: govToolsData?.ownerName || 'On-chain',
        requestedBudget: govToolsData?.requestedBudget || 0,
        pledgedAmount: govToolsData?.pledgedAmount || userPledgedAmountAda,
        userPledged: userPledgedAmountAda,
        initDate: govToolsData?.initDate || new Date(),
        expiryDate: govToolsData?.expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        companyName,
        companyDomain: govToolsData?.companyDomain || 'On-chain',
        abstract:
          govToolsData?.abstract ||
          `You have ${userPledgedAmountAda} ADA pledged to this on-chain proposal. Withdraw anytime before expiry.`,
        categoryName,
      }
    },
    []
  )

  // Transform IUserDeposit to IProposalDetailsData
  const transformDepositToProposalDetails = useCallback(
    (deposit: IUserDeposit): IProposalDetailsData => {
      const baseProposal = transformDepositToProposal(deposit)
      const proposalHash = deposit.proposalHash || deposit.tokenAssetName
      const userPledgedAmountAda = Number(deposit.tokenAmount) / 1_000_000

      // Use user-friendly name for Unknown action kinds
      const actionKind = deposit.cosponsoredProposal.action.kind
      const actionDisplay = actionKind === 'Unknown' ? 'on-chain' : actionKind

      // Add details-specific fields
      return {
        ...baseProposal,
        companyCountry: 'N/A',
        motivation: `This is an ${actionDisplay} proposal. You have pledged ${userPledgedAmountAda} ADA.`,
        rationale: `Your gADA tokens represent your pledge. You can withdraw your ADA anytime before the proposal expires.`,
        govActionId: proposalHash,
        cip129ActionId: proposalHash,
        pledges: [], // Individual pledge data not available from on-chain
      }
    },
    [transformDepositToProposal]
  )

  // Details page data - fetch from GovTools API or user deposits
  const getProposalDetailsById = useCallback(
    async (id: string): Promise<IProposalDetailsData | undefined> => {
      // First try to fetch from GovTools API
      const govToolsProposal = await fetchProposalDetails(id)
      if (govToolsProposal) {
        return govToolsProposal
      }

      // If not found in GovTools, check if it's a blockchain proposal
      // Fetch deposits and look for matching proposal hash
      if (walletObserver.api) {
        try {
          requireConnectedWallet(walletObserver)
          const blaze = await createBlazeWithBrowserWallet(walletObserver)
          const deposits = await fetchUserDeposits(blaze)

          // Find ALL deposits with matching proposal hash (user may have deposited multiple times)
          const matchingDeposits = deposits.filter((d) => d.proposalHash === id)

          if (matchingDeposits.length > 0) {
            logger.debug(
              `Found blockchain proposal with hash: ${id} (${matchingDeposits.length} deposit(s))`
            )

            // Aggregate all deposits for this proposal
            const totalDepositAmount = matchingDeposits.reduce(
              (sum, d) => sum + d.depositAmount,
              0n
            )
            const totalTokenAmount = matchingDeposits.reduce((sum, d) => sum + d.tokenAmount, 0n)

            // Use first deposit as base, but with aggregated amounts
            const aggregatedDeposit: IUserDeposit = {
              ...matchingDeposits[0],
              depositAmount: totalDepositAmount,
              tokenAmount: totalTokenAmount,
            }

            return transformDepositToProposalDetails(aggregatedDeposit)
          }

          // Only warn if wallet IS connected but proposal not found
          logger.warn(
            `Proposal not found with id: ${id} (checked ${deposits.length} user deposits)`
          )
        } catch (error) {
          console.error('Failed to fetch blockchain proposal:', error)
        }
      } else {
        // Wallet not connected yet - silently return undefined
        // This is expected on initial page load before wallet connects
        logger.debug(
          `Wallet not connected yet, cannot fetch blockchain proposal with id: ${id.slice(0, 16)}...`
        )
      }

      // Return undefined
      return undefined
    },
    [walletObserver, transformDepositToProposalDetails]
  )

  // Check if category has any proposals
  const doesCategoryHaveProposals = useCallback(async (categoryName: string) => {
    const proposals = await getProposalsByCategory(categoryName)
    return proposals.length > 0
  }, [])

  // Get proposals in a specific category
  const getProposalCardsInCategory = useCallback(async (categoryName: string) => {
    return getProposalsByCategory(categoryName)
  }, [])

  // Get all proposals from GovTools API
  const getAllProposalCards = useCallback(async (): Promise<IProposalCardData[]> => {
    return getAllProposalsAsCards()
  }, [])

  // Get user's pledged proposals from blockchain
  const getProposalCardsUserPledge = useCallback(async () => {
    // If wallet not connected, return empty array
    if (!walletObserver.api) {
      logger.debug('Wallet not connected, returning empty user pledges')
      return []
    }

    try {
      logger.debug('Fetching user pledges from blockchain...')

      // Create Blaze instance with browser wallet
      requireConnectedWallet(walletObserver)
      const blaze = await createBlazeWithBrowserWallet(walletObserver)

      // Fetch user's deposits from blockchain and GovTools proposals in parallel
      const [deposits, govToolsProposals] = await Promise.all([
        fetchUserDeposits(blaze),
        getAllProposalsAsCards().catch(() => [] as IProposalCardData[]),
      ])

      logger.debug(`Found ${deposits.length} user deposits:`)
      deposits.forEach((d, i) => {
        logger.debug(
          `  ${i + 1}. ${Number(d.depositAmount) / 1_000_000} ADA - Deposit TX: ${d.depositTxHash.slice(0, 16)}...`
        )
        logger.debug(`      Proposal Hash: ${d.proposalHash}`)
        logger.debug(`      Token: ${d.tokenAssetName.slice(0, 20)}...`)
      })

      // Create a map of GovTools proposals by ID for quick lookup
      const govToolsById = new Map<string, IProposalCardData>()
      for (const proposal of govToolsProposals) {
        govToolsById.set(proposal.id, proposal)
      }
      logger.debug(`Loaded ${govToolsById.size} GovTools proposals for enrichment`)

      // Group deposits by proposal hash and aggregate amounts
      const depositsByProposal = new Map<string, IUserDeposit[]>()

      for (const deposit of deposits) {
        const existing = depositsByProposal.get(deposit.proposalHash) || []
        existing.push(deposit)
        depositsByProposal.set(deposit.proposalHash, existing)
      }

      logger.debug(`Deposits grouped into ${depositsByProposal.size} unique proposal(s)`)

      // Transform to proposal cards, combining amounts for same proposal
      const proposalCards: IProposalCardData[] = []

      for (const [proposalHash, proposalDeposits] of depositsByProposal.entries()) {
        // Use the first deposit as the base
        const firstDeposit = proposalDeposits[0]

        // Calculate total amounts across all deposits for this proposal
        const totalDepositAmount = proposalDeposits.reduce((sum, d) => sum + d.depositAmount, 0n)
        const totalTokenAmount = proposalDeposits.reduce((sum, d) => sum + d.tokenAmount, 0n)

        // Create a combined deposit with aggregated amounts
        const aggregatedDeposit: IUserDeposit = {
          ...firstDeposit,
          depositAmount: totalDepositAmount,
          tokenAmount: totalTokenAmount,
        }

        // Try to find matching GovTools proposal by ID
        const govToolsMatch = govToolsById.get(proposalHash)
        if (govToolsMatch) {
          logger.debug(`  Found GovTools match for ${proposalHash.slice(0, 16)}...`)
        }

        proposalCards.push(transformDepositToProposal(aggregatedDeposit, govToolsMatch))

        logger.debug(
          `  Proposal ${proposalHash.slice(0, 16)}...: ${proposalDeposits.length} deposit(s) = ${Number(totalDepositAmount) / 1_000_000} ADA total`
        )
      }

      logger.debug(`Transformed into ${proposalCards.length} proposal cards`)

      // Return aggregated proposal cards
      return proposalCards
    } catch (error) {
      console.error('Failed to fetch user deposits:', error)
      // Fall back to empty array on error
      return []
    }
  }, [walletObserver, transformDepositToProposal])

  // Get random proposals (for "similar proposals" section etc.)
  const getRandomProposals = useCallback(
    async (amount: number, exceptThisId?: string): Promise<IProposalCardData[]> => {
      const allProposals = await getAllProposalCards()
      const candidates = exceptThisId
        ? allProposals.filter((p) => p.id !== exceptThisId)
        : [...allProposals]
      const shuffled = candidates.sort(() => 0.5 - Math.random())

      return shuffled.slice(0, amount)
    },
    [getAllProposalCards]
  )

  // Lazy load proposals with pagination (no category filter)
  const getProposalsPage = useCallback(
    async (start: number = 0, limit: number = 20): Promise<IPaginatedProposals> => {
      return fetchProposalsPage(start, limit)
    },
    []
  )

  // Lazy load proposals by category with client-side pagination
  const getCategoryProposalsPage = useCallback(
    async (
      categoryName: string,
      start: number = 0,
      limit: number = 20
    ): Promise<IPaginatedProposals> => {
      return getProposalsByCategoryPaginated(categoryName, start, limit)
    },
    []
  )

  return {
    getProposalDetailsById,
    doesCategoryHaveProposals,
    getProposalCardsInCategory,
    getAllProposalCards,
    getProposalCardsUserPledge,
    getRandomProposals,
    getProposalsPage,
    getCategoryProposalsPage,
  }
}
