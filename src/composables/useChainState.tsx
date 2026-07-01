import { useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'
import type { useWalletObserver } from '@sundaeswap/wallet-lite'
import type { IWithdrawalPlan } from '@sundaeswap/cosponsor-sdk/browser'
import type { Blaze, Provider, Wallet } from '@blaze-cardano/sdk'
import { createConfiguredBlaze, createReadOnlyBlaze } from '@/lib/cardano/blaze'
import {
  aggregateProposalTotals,
  fetchCachedWithdrawalPlan,
  invalidateChainPlanCache,
  type IProposalTotals,
} from '@/lib/cardano/proposalTotals'

type TWalletObserver = ReturnType<typeof useWalletObserver>['observer']

export interface IChainContext {
  plan: IWithdrawalPlan
  totals: IProposalTotals
  blaze: Blaze<Provider, Wallet>
  walletConnected: boolean
}

/**
 * Chain-state loader shared by every proposal-data consumer: builds a
 * wallet-bound Blaze if a wallet is connected, otherwise the cached
 * read-only Blaze (see `createReadOnlyBlaze`), then loads the cosponsor
 * withdrawal plan through its own module cache. Both caches live at
 * module scope, so concurrent callers across different component
 * instances (e.g. one CarouselProposals per category on /all-proposals)
 * share a single Blockfrost provider and UTxO scan instead of each
 * paying for their own.
 */
export const useChainState = (walletObserver: TWalletObserver) => {
  // Drop the cached chain plan whenever the wallet API reference flips
  // (connect / disconnect / wallet switch). Keeps the userTokens portion
  // of the plan from going stale across wallet identity changes.
  useEffect(() => {
    invalidateChainPlanCache()
  }, [walletObserver.api])

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

  return { loadChainContext }
}
