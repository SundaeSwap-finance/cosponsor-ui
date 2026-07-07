// Runtime configuration injected at deploy time by scripts/interpolate-index.sh
// (which substitutes the @@APP_CONFIG@@ placeholder in dist/index.html with the
// contents of config/${ENV}.json). In dev mode, vite's injectConfig() plugin
// inlines config/${APP_ENV}.json directly.

export type TCardanoNetwork = 'preview' | 'preprod' | 'mainnet' | 'sanchonet'

export interface IAppConfig {
  appEnv: 'preview' | 'mainnet'
  blockfrostNetwork: TCardanoNetwork
  blockfrostApiKey: string
  blockfrostApiUrl: string
  ogmiosUrl?: string
  /**
   * Public origin of the deployed UI for this environment (e.g.
   * `https://cosponsor.preview.sundae.fi`). Used to build proposal anchor URLs
   * so indexers can fetch the CIP-108 metadata served under `/proposals/`.
   * Env-specific — update when the domain changes.
   */
  appBaseUrl: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- augmenting the DOM `Window` global; the name is fixed by the lib.
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
