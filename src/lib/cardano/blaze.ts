import { createBlazeWithBrowserWallet } from '@sundaeswap/cosponsor-sdk/browser'
import { config } from '@/lib/config'

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
