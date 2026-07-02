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

// Module-level cache for the wallet-bound Blaze `loadChainContext` reads
// from. Mirrors `createReadOnlyBlaze`'s cache: concurrent callers across
// different component instances share one provider/params fetch instead of
// each building their own. Deliberately separate from `createConfiguredBlaze`
// itself — ModalSponsor/ModalWithdraw call that directly and uncached
// because they need a fresh instance right before submitting a transaction;
// this cache is only for `loadChainContext`'s read-only chain-state queries
// (pledges, totals). Invalidated alongside the chain-plan cache whenever the
// wallet identity changes.
let cachedConfiguredBlaze: Promise<Blaze<Provider, Wallet>> | undefined

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
  // Drop the cached chain plan and wallet-bound Blaze whenever the wallet
  // API reference flips (connect / disconnect / wallet switch). Keeps the
  // userTokens portion of the plan, and the Blaze instance itself, from
  // going stale across wallet identity changes.
  useEffect(() => {
    invalidateChainPlanCache()
    cachedConfiguredBlaze = undefined
  }, [walletObserver.api])

  const loadChainContext = useCallback(async (): Promise<IChainContext | undefined> => {
    try {
      const walletConnected = !!walletObserver.api
      let blaze: Blaze<Provider, Wallet>
      if (walletConnected) {
        requireConnectedWallet(walletObserver)
        if (!cachedConfiguredBlaze) {
          // SDK's `createBlazeWithBrowserWallet` returns Blaze<Provider, Wallet>
          // from the SDK's nested @blaze-cardano/sdk; the UI's Blaze type comes
          // from its own 0.8.0 pin. Same shape at runtime — version-skew is
          // TODO.md "Tech Debt: Blaze Override Stack" (task #8).
          cachedConfiguredBlaze = (createConfiguredBlaze(walletObserver) as Promise<unknown>).catch(
            (error: unknown) => {
              cachedConfiguredBlaze = undefined
              throw error
            }
          ) as Promise<Blaze<Provider, Wallet>>
        }
        blaze = await cachedConfiguredBlaze
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
