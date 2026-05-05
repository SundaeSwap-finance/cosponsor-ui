/**
 * Asserts that a wallet observer has a connected CIP-30 API.
 *
 * @sundaeswap/wallet-lite's WalletObserver types `api` as
 * `Cip30WalletApi | undefined` because the user may not have a wallet
 * connected yet. The cosponsor SDK's BrowserWalletObserver requires
 * `api` to be defined. This helper bridges the two with a single
 * runtime check + type-narrowing assertion, so callers don't have to
 * inline a guard at every SDK call site.
 *
 * Throws a user-facing error if the wallet is not connected.
 */
export function requireConnectedWallet<T extends { api?: unknown }>(
  observer: T
): asserts observer is T & { api: NonNullable<T['api']> } {
  if (!observer.api) {
    throw new Error('Wallet not connected. Please connect your wallet to continue.')
  }
}
