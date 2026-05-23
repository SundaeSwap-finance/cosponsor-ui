import { Blaze, type Provider, type Wallet } from '@blaze-cardano/sdk'
import { createBlazeWithBrowserWallet, createProvider } from '@sundaeswap/cosponsor-sdk/browser'
import { config } from '@/lib/config'
// Side-effect import: monkey-patches @blaze-cardano/query's Blockfrost provider
// to fix upstream bugs in evaluateTransaction. See blaze-patches.ts for the
// full bug report and the PR-ready rationale.
import './blaze-patches'

// Single point that injects runtime Blockfrost credentials into the SDK,
// so call sites don't repeat the options object (and won't drift apart).
export const createConfiguredBlaze: typeof createBlazeWithBrowserWallet = (
  walletObserver,
  options
) =>
  createBlazeWithBrowserWallet(walletObserver, {
    blockfrostApiKey: config.blockfrostApiKey,
    network: config.blockfrostNetwork,
    ...options,
  })

// Stub wallet so we can build a Blaze instance for read-only chain queries
// (e.g. aggregating script-address UTxOs) before the user connects a wallet.
// The SDK's chain scanners type-require `Blaze<Provider, Wallet>` but only
// actually call `getUnspentOutputs()` on the wallet to find the user's gADA
// holdings — returning `[]` makes that branch a no-op while the script-side
// scan still runs. Any other wallet method on this instance is a bug and
// throws loudly rather than silently fabricating a result.
const createReadOnlyWallet = (): Wallet => {
  const denied = (method: string) => async () => {
    throw new Error(`Read-only Blaze: wallet.${method} is not available without a connected wallet`)
  }
  return {
    getNetworkId: denied('getNetworkId'),
    getUnspentOutputs: async () => [],
    getBalance: denied('getBalance'),
    getUsedAddresses: denied('getUsedAddresses'),
    getUnusedAddresses: denied('getUnusedAddresses'),
    getChangeAddress: denied('getChangeAddress'),
    getRewardAddresses: denied('getRewardAddresses'),
    signTransaction: denied('signTransaction'),
    signData: denied('signData'),
    postTransaction: denied('postTransaction'),
    getCollateral: denied('getCollateral'),
  } as unknown as Wallet
}

// Builds a Blaze instance with no wallet attached — usable for chain-state
// queries (script address scans, params, etc.) but rejects every wallet
// operation. Call this when no CIP-30 wallet is connected and you still
// need to read on-chain data, e.g. proposal progress bars on /proposals.
export const createReadOnlyBlaze = async (): Promise<Blaze<Provider, Wallet>> => {
  const provider = await createProvider({
    blockfrostApiKey: config.blockfrostApiKey,
    network: config.blockfrostNetwork,
  })
  return Blaze.from(provider, createReadOnlyWallet())
}
