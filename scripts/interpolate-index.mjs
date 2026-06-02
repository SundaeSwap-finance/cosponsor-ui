#!/usr/bin/env node
// JS port of scripts/interpolate-index.sh — substitutes @@APP_CONFIG@@ in
// dist/index.html with the contents of config/${ENV}.json. Idempotent: if the
// placeholder is absent (e.g. interpolate-index.sh already ran), this is a no-op
// for the index file but still writes the archive copy and latest.json.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Note: not honoring $ENV here on purpose — under `bash -l` (which Nixpacks
// uses for build steps), $ENV defaults to /etc/profile, which would resolve
// to config//etc/profile.json. Use APP_ENV / COSPONSOR_APP_ENV instead.
const env = process.env.APP_ENV || process.env.COSPONSOR_APP_ENV || 'dev'
const version = process.env.VERSION || ''
const indexFile = process.argv[2] || `${root}/dist/index.html`
const archiveFile = process.argv[3] || (version ? `${root}/dist/${version}.html` : null)

let commitHash = process.env.COMMIT_ID || ''
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse HEAD', { cwd: root }).toString().trim()
  } catch {
    commitHash = ''
  }
}

const configPath = `${root}/config/${env}.json`
const baseConfig = JSON.parse(readFileSync(configPath, 'utf8'))

// Layer env-var overrides on top of the JSON. Lets CI/CD (e.g. AWS
// CloudFormation parameter store) swap endpoints per-deployment without
// editing committed JSON. Only known keys are overridden; unknown env vars
// are ignored. Mapping mirrors the IAppConfig shape in src/lib/config.ts.
const envOverrides = {
  appEnv: process.env.COSPONSOR_APP_ENV,
  blockfrostNetwork: process.env.COSPONSOR_BLOCKFROST_NETWORK,
  blockfrostApiKey: process.env.COSPONSOR_BLOCKFROST_API_KEY,
  blockfrostApiUrl: process.env.COSPONSOR_BLOCKFROST_API_URL,
  ogmiosUrl: process.env.COSPONSOR_OGMIOS_URL,
}
for (const [key, value] of Object.entries(envOverrides)) {
  if (value !== undefined && value !== '') {
    baseConfig[key] = value
  }
}
const configJson = JSON.stringify(baseConfig)

// eslint-disable-next-line no-console
console.log(`Interpolating ${indexFile} with config/${env}.json`)

const html = readFileSync(indexFile, 'utf8')
const interpolated = html.replaceAll('@@APP_CONFIG@@', configJson)
writeFileSync(indexFile, interpolated)
if (archiveFile) {
  writeFileSync(archiveFile, interpolated)
}

writeFileSync(
  `${root}/dist/latest.json`,
  JSON.stringify({
    commitHash,
    buildId: version,
    buildDate: Math.floor(Date.now() / 1000),
  })
)
