import { useSyncExternalStore } from 'react'
import {
  getOptimisticPledgesSnapshot,
  subscribeOptimisticPledges,
} from '@/lib/cardano/optimisticPledges'

/**
 * Reactive view of the optimistic-pledge store: the returned map is a new
 * immutable snapshot whenever a pledge is recorded/cleared, so using it in
 * hook dependency arrays re-runs data fetching (and re-renders gating UI)
 * the moment a pledge tx is submitted — no page refresh needed.
 */
export const useOptimisticPledges = (): ReadonlyMap<string, bigint> =>
  useSyncExternalStore(subscribeOptimisticPledges, getOptimisticPledgesSnapshot)
