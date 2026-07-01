// Build metadata injected at build time by vite.config.ts's injectConfig()
// plugin, sourced from the COMMIT_HASH/VERSION env vars that
// scripts/package-artifact.sh sets before running `bun run build`. Unlike
// `config.ts`'s __APP_CONFIG, this is allowed to be missing/empty — local
// dev builds don't set those env vars, so buildId/commitHash are just ''.

export interface IBuildInfo {
  commitHash: string
  buildId: string
  buildDate: number
}

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- augmenting the DOM `Window` global; the name is fixed by the lib.
  interface Window {
    __BUILD_CONFIG?: IBuildInfo
  }
}

export const buildInfo: IBuildInfo = window.__BUILD_CONFIG ?? {
  commitHash: '',
  buildId: '',
  buildDate: Date.now(),
}
