/**
 * Optimistic pledge totals.
 *
 * After a pledge tx is submitted, the script-address scan won't see the new
 * UTxO until the tx is in a block AND Blockfrost has indexed it — so even a
 * fresh refetch keeps serving the pre-pledge pool total. Without a bridge,
 * the sponsor flow happily lets the same user pledge the full remaining need
 * over and over until a hard refresh.
 *
 * The store keeps, per proposal key, the minimum pool total we KNOW exists
 * after our own submitted pledge(s). Consumers overlay it as
 * `max(chainTotal, expectedMin)`: once the chain catches up the max resolves
 * to the chain value and entries become inert — no expiry bookkeeping.
 * Session-local by design (other users' pledges arrive via the chain scan).
 *
 * The snapshot is immutable (a new Map per mutation) so React consumers can
 * subscribe via useSyncExternalStore and use the map itself as a dependency
 * — see composables/useOptimisticPledges.
 */

let snapshot: ReadonlyMap<string, bigint> = new Map()

const listeners = new Set<() => void>()

/**
 * Record a submitted pledge: after this, every key resolves to at least
 * `expectedTotalLovelace`. Pass every id the proposal is known by (card id,
 * sourceUrlId, on-chain hash) — different views look totals up by different
 * keys.
 */
export const recordOptimisticPledge = (
  keys: Array<string | undefined>,
  expectedTotalLovelace: bigint
): void => {
  const next = new Map(snapshot)
  let changed = false
  for (const key of keys) {
    if (!key) {
      continue
    }
    const prev = next.get(key) ?? 0n
    if (expectedTotalLovelace > prev) {
      next.set(key, expectedTotalLovelace)
      changed = true
    }
  }
  if (!changed) {
    return
  }
  snapshot = next
  listeners.forEach((listener) => listener())
}

/**
 * Drop entries for a proposal — call after a withdrawal, when the pool total
 * legitimately went DOWN and pinning the old maximum would keep the UI at
 * the pre-withdrawal amount until the next hard refresh.
 */
export const clearOptimisticPledges = (keys: Array<string | undefined>): void => {
  const next = new Map(snapshot)
  let changed = false
  for (const key of keys) {
    if (key && next.delete(key)) {
      changed = true
    }
  }
  if (!changed) {
    return
  }
  snapshot = next
  listeners.forEach((listener) => listener())
}

/**
 * Overlay a chain-derived pool total with the optimistic minimum for any of
 * the given keys. Pure — pass the snapshot from useOptimisticPledges so the
 * call site re-renders when the store changes.
 */
export const overlayPledgedLovelace = (
  overlay: ReadonlyMap<string, bigint>,
  keys: Array<string | undefined>,
  chainLovelace: bigint
): bigint => {
  let result = chainLovelace
  for (const key of keys) {
    if (!key) {
      continue
    }
    const min = overlay.get(key)
    if (min !== undefined && min > result) {
      result = min
    }
  }
  return result
}

export const subscribeOptimisticPledges = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getOptimisticPledgesSnapshot = (): ReadonlyMap<string, bigint> => snapshot
