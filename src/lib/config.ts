// Runtime configuration injected at deploy time by scripts/interpolate-index.sh
// (which substitutes the @@APP_CONFIG@@ placeholder in dist/index.html with the
// contents of config/${ENV}.json). In dev mode, vite's injectConfig() plugin
// inlines config/${APP_ENV}.json directly.

export type CardanoNetwork = 'preview' | 'preprod' | 'mainnet' | 'sanchonet'

export interface IAppConfig {
  appEnv: 'preview' | 'mainnet'
  blockfrostNetwork: CardanoNetwork
  blockfrostApiKey: string
  ogmiosUrl?: string
  // Base URL of cosponsor-api. The build derives a sensible default
  // from appEnv when this is missing, so existing deploy configs
  // keep working without an update.
  cosponsorApiUrl?: string
}

declare global {
  interface Window {
    __APP_CONFIG?: IAppConfig
  }
}

if (!window.__APP_CONFIG) {
  throw new Error(
    'window.__APP_CONFIG was not injected. In production this means the ' +
      'deploy-time interpolate-index.sh step did not run; in dev it means ' +
      'vite was started without a config file resolvable from APP_ENV.'
  )
}

export const config: IAppConfig = window.__APP_CONFIG
