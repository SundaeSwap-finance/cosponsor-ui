import { IPledgeData, IProposalCardData, IProposalDetailsData } from '@/types/Proposal'
import { useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'

import { useWalletObserver } from '@sundaeswap/wallet-lite'
import type { IUserDeposit, IWithdrawalPlan } from '@sundaeswap/cosponsor-sdk/browser'
import { ACTION_TYPE_DISPLAY_NAMES } from '@/lib/cardano/governanceActions'
import type { Blaze, Provider, Wallet } from '@blaze-cardano/sdk'
import { createConfiguredBlaze, createReadOnlyBlaze } from '@/lib/cardano/blaze'
import { ensureGovActionDepositAda, useGovActionDeposit } from '@/composables/useGovActionDeposit'
import {
  aggregateProposalTotals,
  deriveUserDeposits,
  fetchCachedWithdrawalPlan,
  invalidateChainPlanCache,
  lovelaceToAda,
  type IProposalTotals,
} from '@/lib/cardano/proposalTotals'
import {
  getAllProposalsAsCards,
  getProposalDetailsById as fetchProposalDetails,
  getProposalsByCategory,
  fetchProposalsPage,
  getProposalsByCategoryPaginated,
  IPaginatedProposals,
} from '@/api/govToolsProposals'

interface IChainContext {
  plan: IWithdrawalPlan
  totals: IProposalTotals
  blaze: Blaze<Provider, Wallet>
  walletConnected: boolean
}

export const useGetProposalData = () => {
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer
  const { depositAda: cosponsorTarget } = useGovActionDeposit()

  // Drop the cached chain plan whenever the wallet API reference flips
  // (connect / disconnect / wallet switch). Keeps the userTokens portion
  // of the plan from going stale across wallet identity changes.
  useEffect(() => {
    invalidateChainPlanCache()
  }, [walletObserver.api])

  // Single chain-state load shared by every callback below: builds a
  // wallet-bound Blaze if a wallet is connected, otherwise a read-only
  // Blaze. Fetches the SDK withdrawal plan through the module cache so
  // back-to-back page navigations don't re-scan the script address. The
  // user-deposit derivation is a pure step on top of the same plan —
  // see `proposalTotals.ts`.
  const loadChainContext = useCallback(async (): Promise<IChainContext | undefined> => {
    try {
      const walletConnected = !!walletObserver.api
      let blaze: Blaze<Provider, Wallet>
      if (walletConnected) {
        requireConnectedWallet(walletObserver)
        // SDK's `createBlazeWithBrowserWallet` returns Blaze<Provider, Wallet>
        // from the SDK's nested @blaze-cardano/sdk; the UI's Blaze type comes
        // from its own 0.8.0 pin. Same shape at runtime — version-skew is
        // TODO.md "Tech Debt: Blaze Override Stack" (task #8).
        blaze = (await createConfiguredBlaze(walletObserver)) as unknown as Blaze<Provider, Wallet>
      } else {
        blaze = await createReadOnlyBlaze()
      }
      const plan = await fetchCachedWithdrawalPlan(blaze)
      const totals = aggregateProposalTotals(plan)
      return { plan, totals, blaze, walletConnected }
    } catch (error) {
      logger.warn('Failed to load cosponsor chain context:', error)
      return undefined
    }
  }, [walletObserver])

  // Transform IUserDeposit to IProposalCardData
  // Optionally pass GovTools data to enrich the proposal with proper category info
  const transformDepositToProposal = useCallback(
    (deposit: IUserDeposit, govToolsData?: IProposalCardData): IProposalCardData => {
      // Calculate amounts in ADA
      const userPledgedAmountAda = Number(deposit.tokenAmount) / 1_000_000

      const proposalHash = deposit.proposalHash || deposit.tokenAssetName

      // The deposit's own `proposalUrl` is no longer trustworthy — when the
      // SDK can't decode a UTxO's datum (current NewConstitution bug) it
      // fills the URL from an unrelated UTxO's anchor, so a recovered id
      // from this field can misidentify the proposal. Callers resolve the
      // canonical URL id via the chain-state map and pass the matched
      // proposal in as `govToolsData`; without a match we fall back to the
      // on-chain hash, which is always exact.

      // Use GovTools data if available, otherwise fallback to on-chain data
      // Replace "Unknown" or "Processed" with more user-friendly "On-chain Proposal".
      // For valid action kinds, prefer the user-facing display name
      // (`NicePoll → "Info Action"`, etc.) over the raw on-chain enum.
      const actionKind = deposit.actionSummary.action.kind
      const needsFallback = actionKind === 'Unknown' || actionKind === 'Processed'
      const actionDisplay = ACTION_TYPE_DISPLAY_NAMES[actionKind] ?? actionKind
      const categoryName =
        govToolsData?.categoryName || (needsFallback ? 'On-chain Proposal' : actionDisplay)
      const companyName =
        govToolsData?.companyName || (needsFallback ? 'On-chain Proposal' : actionDisplay)

      return {
        id: govToolsData?.id || proposalHash,
        name: govToolsData?.name || `Proposal ${proposalHash.slice(0, 8)}...`,
        ownerId: govToolsData?.ownerId || proposalHash.slice(0, 16),
        ownerName: govToolsData?.ownerName || 'On-chain',
        requestedBudget: govToolsData?.requestedBudget || 0,
        cosponsorTarget: govToolsData?.cosponsorTarget ?? cosponsorTarget ?? undefined,
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
        // Re-use the on-chain procedure verbatim when the SDK could recover
        // it (and round-trip-verify its hash matches the on-chain gADA
        // token). Without this, ModalSponsor rebuilds the procedure from
        // card-level fields and ends up with slightly different
        // action/anchor data, hashing to a different proposal token —
        // that's the "Sponsor sponsored a different proposal" / "always
        // creates a new entry" bug from the Pi review.
        existingCosponsoredProposal: deposit.cosponsoredProposal ?? undefined,
        // Carry the action-specific fields through from the GovTools/mock
        // listing so the rebuild path in ModalSponsor has enough data to
        // reconstruct the procedure when the SDK can't (e.g. variants the
        // datum decoder hasn't been taught yet). ModalSponsor verifies the
        // rebuilt hash matches `proposalHash` before pledging, so dropping
        // these would block legitimate pledges on those variants without
        // adding any safety the hash check doesn't already provide.
        withdrawals: govToolsData?.withdrawals,
        hardForkVersion: govToolsData?.hardForkVersion,
        constitutionHash: govToolsData?.constitutionHash,
        constitutionUrl: govToolsData?.constitutionUrl,
        sourceUrlId: govToolsData?.sourceUrlId,
        proposalHash,
      }
    },
    [cosponsorTarget]
  )

  // Transform IUserDeposit to IProposalDetailsData
  const transformDepositToProposalDetails = useCallback(
    (deposit: IUserDeposit): IProposalDetailsData => {
      const baseProposal = transformDepositToProposal(deposit)
      const proposalHash = deposit.proposalHash || deposit.tokenAssetName
      const userPledgedAmountAda = Number(deposit.tokenAmount) / 1_000_000

      // Use user-friendly name for Unknown action kinds
      const actionKind = deposit.actionSummary.action.kind
      const actionDisplay = actionKind === 'Unknown' ? 'on-chain' : actionKind

      // Add details-specific fields
      return {
        ...baseProposal,
        companyCountry: 'N/A',
        motivation: `This is an ${actionDisplay} proposal. You have pledged ${userPledgedAmountAda} ADA.`,
        rationale: `Your gADA tokens represent your pledge. You can withdraw your ADA anytime before the proposal expires.`,
        govActionId: proposalHash,
        // The on-chain gADA token hash isn't a governance action id, so there's
        // no valid CIP-129 value to show here — leave empty (the detail page
        // hides the row).
        cip129ActionId: '',
        pledges: [], // Individual pledge data not available from on-chain
      }
    },
    [transformDepositToProposal]
  )

  // Details page data - fetch from GovTools API or user deposits
  const getProposalDetailsById = useCallback(
    async (id: string): Promise<IProposalDetailsData | undefined> => {
      // Look up via unified proposal list (mocks + GovTools).
      const govToolsProposal = await fetchProposalDetails(id)

      // Merge on-chain data so the detail page reflects reality:
      // - userPledged comes from the connected wallet's gADA holdings
      // - pledgedAmount is chain-state total across ALL cosponsors
      // Both come out of one chain plan (see `loadChainContext`).
      let userPledgedAda = 0
      let depositOverlay:
        | { totalTokenAmount: bigint; totalDepositAmount: bigint; sample: IUserDeposit }
        | undefined
      let chainPledgedAda: number | undefined
      let chainPledges: IPledgeData[] = []
      // Live gov_action_deposit — the synchronous cache reader used inside
      // `govToolsProposals.ts` returns null on the very first call, so we
      // re-await here to backfill cosponsorTarget when it landed late.
      const targetAda = await ensureGovActionDepositAda()
      const ctx = await loadChainContext()
      if (ctx) {
        const { plan, totals, walletConnected } = ctx
        const deposits = walletConnected ? deriveUserDeposits(plan) : []
        const matchingDeposits = deposits.filter((d) => {
          if (d.proposalHash === id) {
            return true
          }
          const canonicalUrlId = totals.urlIdByProposalHash.get(d.proposalHash)
          return canonicalUrlId === id
        })
        if (matchingDeposits.length > 0) {
          depositOverlay = {
            totalDepositAmount: matchingDeposits.reduce((s, d) => s + d.depositAmount, 0n),
            totalTokenAmount: matchingDeposits.reduce((s, d) => s + d.tokenAmount, 0n),
            sample: matchingDeposits[0],
          }
          userPledgedAda = Number(depositOverlay.totalTokenAmount) / 1_000_000
        }
        // Surface every on-chain pledge as a row in Proposal Sponsors.
        // The wallet/owner behind each UTxO isn't recoverable from the
        // script datum alone (would need to walk back to the mint tx),
        // so we label them generically until the BE indexer can resolve
        // payer addresses.
        //
        // Union three buckets so we don't miss deposits that drifted across
        // identity variants (e.g. a pre-identity-work deposit with a
        // different proposalHash but the same anchor URL, or vice versa):
        //  1. UTxOs whose anchor URL decodes to this route id
        //  2. UTxOs whose gADA hash equals this route id
        //  3. UTxOs whose gADA hash maps via the chain map to this URL id
        // Dedupe by (txHash, outputIndex).
        const pledgeBuckets = [
          totals.pledgesByUrlId.get(id) ?? [],
          totals.pledgesByProposalHash.get(id) ?? [],
        ]
        for (const [hash, urlId] of totals.urlIdByProposalHash) {
          if (urlId === id && hash !== id) {
            const extras = totals.pledgesByProposalHash.get(hash)
            if (extras) {
              pledgeBuckets.push(extras)
            }
          }
        }
        const seen = new Set<string>()
        let chainLovelace = 0n
        chainPledges = []
        for (const bucket of pledgeBuckets) {
          for (const b of bucket) {
            const key = `${b.txHash}#${b.outputIndex}`
            if (seen.has(key)) {
              continue
            }
            seen.add(key)
            chainLovelace += b.lockedAmount
            chainPledges.push({
              id: key,
              ownerName: 'On-chain',
              amount: lovelaceToAda(b.lockedAmount),
            })
          }
        }
        if (chainLovelace > 0n) {
          chainPledgedAda = lovelaceToAda(chainLovelace)
        }
      }

      if (govToolsProposal) {
        const cosponsorTargetAda = govToolsProposal.cosponsorTarget ?? targetAda ?? undefined
        if (
          !depositOverlay &&
          chainPledgedAda === undefined &&
          cosponsorTargetAda === govToolsProposal.cosponsorTarget
        ) {
          return govToolsProposal
        }
        return {
          ...govToolsProposal,
          cosponsorTarget: cosponsorTargetAda,
          userPledged: userPledgedAda || govToolsProposal.userPledged,
          pledgedAmount:
            chainPledgedAda ?? Math.max(govToolsProposal.pledgedAmount ?? 0, userPledgedAda),
          pledges: chainPledges.length > 0 ? chainPledges : govToolsProposal.pledges,
        }
      }

      // No mock/GovTools entry — surface the on-chain deposit alone if we have one.
      if (depositOverlay) {
        const base = transformDepositToProposalDetails({
          ...depositOverlay.sample,
          depositAmount: depositOverlay.totalDepositAmount,
          tokenAmount: depositOverlay.totalTokenAmount,
        })
        const withTarget =
          base.cosponsorTarget === undefined && targetAda !== null
            ? { ...base, cosponsorTarget: targetAda }
            : base
        const withChainTotal =
          chainPledgedAda !== undefined
            ? { ...withTarget, pledgedAmount: chainPledgedAda }
            : withTarget
        return chainPledges.length > 0
          ? { ...withChainTotal, pledges: chainPledges }
          : withChainTotal
      }

      logger.warn(`Proposal not found with id: ${id}`)
      return undefined
    },
    [loadChainContext, transformDepositToProposalDetails]
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

      // One chain plan, both views: `deriveUserDeposits` correlates the
      // wallet's gADA tokens with the script UTxO list, `totals` aggregates
      // every UTxO at the script address. The shared `loadChainContext`
      // de-dupes the underlying `fetchWithdrawalPlan` call across this
      // hook's other callbacks.
      const [ctx, govToolsProposals] = await Promise.all([
        loadChainContext(),
        getAllProposalsAsCards().catch(() => [] as IProposalCardData[]),
      ])
      if (!ctx) {
        logger.warn('Chain context unavailable, returning empty user pledges')
        return []
      }
      const { plan, totals } = ctx
      const deposits = deriveUserDeposits(plan)

      logger.debug(`Found ${deposits.length} user deposits:`)
      deposits.forEach((d, i) => {
        logger.debug(
          `  ${i + 1}. ${Number(d.depositAmount) / 1_000_000} ADA - Deposit TX: ${d.depositTxHash.slice(0, 16)}...`
        )
        logger.debug(`      Proposal Hash: ${d.proposalHash}`)
        logger.debug(`      Token: ${d.tokenAssetName.slice(0, 20)}...`)
      })

      // Unified id → proposal lookup (mocks + GovTools). Used to enrich each
      // deposit with the original proposal's metadata once we recover the
      // URL-space id from the deposit's anchor URL.
      const proposalById = new Map<string, IProposalCardData>()
      for (const proposal of govToolsProposals) {
        proposalById.set(proposal.id, proposal)
      }
      logger.debug(`Loaded ${proposalById.size} proposals (mocks + GovTools) for enrichment`)

      // Group deposits by on-chain proposalHash (= gADA tokenAssetName).
      // Cross-procedure aggregation via the recovered URL id used to live
      // here, but the SDK's fetchUserDeposits falls back to "first UTxO's
      // anchor URL" whenever it can't decode a datum (e.g. the current
      // NewConstitution serialization bug — see TODO.md). That fallback
      // makes URL recovery unsafe: a misdecoded deposit ends up sharing a
      // URL with an unrelated proposal and the two get merged. Grouping by
      // tokenAssetName is always exact; URL recovery still drives the
      // name/category enrichment below.
      const depositsByProposal = new Map<string, IUserDeposit[]>()

      for (const deposit of deposits) {
        const groupKey = deposit.proposalHash
        const existing = depositsByProposal.get(groupKey) || []
        existing.push(deposit)
        depositsByProposal.set(groupKey, existing)
      }

      logger.debug(`Deposits grouped into ${depositsByProposal.size} unique proposal(s)`)

      // Transform to proposal cards, combining amounts for same proposal
      const proposalCards: IProposalCardData[] = []

      for (const [groupKey, proposalDeposits] of depositsByProposal.entries()) {
        const firstDeposit = proposalDeposits[0]

        const totalDepositAmount = proposalDeposits.reduce((sum, d) => sum + d.depositAmount, 0n)
        const totalTokenAmount = proposalDeposits.reduce((sum, d) => sum + d.tokenAmount, 0n)

        const aggregatedDeposit: IUserDeposit = {
          ...firstDeposit,
          depositAmount: totalDepositAmount,
          tokenAmount: totalTokenAmount,
        }

        // Enrich with mock/GovTools metadata. Resolve URL id from the chain
        // scan's canonical `proposalHash → urlId` map rather than the deposit's
        // own `proposalUrl` — the SDK's per-token URL field falls back to
        // an unrelated UTxO's anchor when a datum fails to decode (current
        // NewConstitution bug), so trusting it relabels distinct deposits as
        // the same proposal. The chain map only contains entries whose datum
        // decoded cleanly, so a miss here means "stay generic" instead of
        // "guess".
        const canonicalUrlId = totals.urlIdByProposalHash.get(groupKey)
        const proposalMatch =
          (canonicalUrlId && proposalById.get(canonicalUrlId)) || proposalById.get(groupKey)
        if (proposalMatch) {
          logger.debug(
            `  Matched ${groupKey.slice(0, 16)}... to "${proposalMatch.name}" via ${canonicalUrlId ? 'chain URL id' : 'on-chain hash'}`
          )
        }

        const card = transformDepositToProposal(aggregatedDeposit, proposalMatch)

        // Overlay chain-state total across all cosponsors. Prefer the
        // canonical URL id (matches the listings) and fall back to the
        // on-chain hash for proposals whose anchor URL never decoded.
        const lovelace =
          (canonicalUrlId ? totals.byUrlId.get(canonicalUrlId) : undefined) ??
          totals.byProposalHash.get(groupKey) ??
          0n
        if (lovelace > 0n) {
          card.pledgedAmount = lovelaceToAda(lovelace)
        }
        proposalCards.push(card)

        logger.debug(
          `  ${groupKey.slice(0, 16)}...: ${proposalDeposits.length} deposit(s) = ${Number(totalDepositAmount) / 1_000_000} ADA total`
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
  }, [walletObserver.api, loadChainContext, transformDepositToProposal])

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

  // Overlay both the live cosponsor target (gov_action_deposit) and the
  // chain-state pledge totals onto a page of proposals. Both fetches are
  // wallet-independent: the deposit is a protocol parameter, and the
  // script-address scan uses a read-only Blaze when no wallet is connected
  // so progress bars light up pre-connect. The data layer in
  // `govToolsProposals.ts` reads the deposit synchronously from cache; on
  // first paint that cache is empty, which is why the overlay here also
  // fills `cosponsorTarget` instead of relying on the synchronous read.
  const applyChainTotals = useCallback(
    async (page: IPaginatedProposals): Promise<IPaginatedProposals> => {
      const [ctx, targetAda] = await Promise.all([loadChainContext(), ensureGovActionDepositAda()])
      const totals = ctx?.totals
      if (!totals && targetAda === null) {
        return page
      }
      return {
        ...page,
        proposals: page.proposals.map((p) => {
          const lovelace = totals?.byUrlId.get(p.id) ?? totals?.byProposalHash.get(p.id) ?? 0n
          const pledgedAmount = lovelace > 0n ? lovelaceToAda(lovelace) : p.pledgedAmount
          const cosponsorTargetAda = p.cosponsorTarget ?? targetAda ?? undefined
          if (pledgedAmount === p.pledgedAmount && cosponsorTargetAda === p.cosponsorTarget) {
            return p
          }
          return { ...p, pledgedAmount, cosponsorTarget: cosponsorTargetAda }
        }),
      }
    },
    [loadChainContext]
  )

  // Lazy load proposals with pagination (no category filter)
  const getProposalsPage = useCallback(
    async (start: number = 0, limit: number = 20): Promise<IPaginatedProposals> => {
      const page = await fetchProposalsPage(start, limit)
      return applyChainTotals(page)
    },
    [applyChainTotals]
  )

  // Lazy load proposals by category with client-side pagination
  const getCategoryProposalsPage = useCallback(
    async (
      categoryName: string,
      start: number = 0,
      limit: number = 20
    ): Promise<IPaginatedProposals> => {
      const page = await getProposalsByCategoryPaginated(categoryName, start, limit)
      return applyChainTotals(page)
    },
    [applyChainTotals]
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
