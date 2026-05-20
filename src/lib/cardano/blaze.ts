import { createBlazeWithBrowserWallet } from '@sundaeswap/cosponsor-sdk/browser'
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
