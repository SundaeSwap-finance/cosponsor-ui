# CoSponsor Build & Deployment Guide

## Prerequisites

- [Bun](https://bun.sh/) installed
- A Blockfrost API key for the target Cardano network
- (Optional) An Ogmios WebSocket URL for mempool-aware script evaluation

## Build pipeline

The SDK is published to npm as `@dezons/cosponsor-sdk` (currently
`1.0.0-alpha.1` under the `alpha` dist-tag). The UI consumes it as a
regular dependency — no local linking required.

### 1. Install dependencies

```bash
cd cosponsor-ui
bun install
```

This pulls `@dezons/cosponsor-sdk@1.0.0-alpha.1` from the registry along
with everything else.

### 2. Configure environment

Create `cosponsor-ui/.env` (or copy from `.env.example` if present):

```env
CARDANO_NETWORK_ID=0
COSPONSOR_APP_ENV=preview
COSPONSOR_BLOCKFROST_NETWORK=preview
COSPONSOR_BLOCKFROST_API_URL=https://cardano-preview.blockfrost.io/api/v0
COSPONSOR_BLOCKFROST_API_KEY=<your-preview-key>
COSPONSOR_SCRIPT_ADDRESS=<cosponsor-script-address>
COSPONSOR_POLICY_ID=<cosponsor-policy-id>
COSPONSOR_OGMIOS_URL=<ogmios-websocket-url>   # optional
```

Vite only exposes variables prefixed with `COSPONSOR_*` to the client
bundle (see `vite.config.ts`).

### 3. Build the UI

```bash
bun run build
```

Output lands in `dist/` — a static SPA ready to serve.

### 4. Deploy

The `dist/` folder is a vanilla static site. Serve it with anything:

```bash
# Quick local preview
bun run preview

# Or with nginx/Caddy/etc., serve dist/ with SPA fallback to index.html
```

## Local development

```bash
bun run dev            # mainnet config
bun run dev:preview    # preview testnet config
```

The SDK is silent by default; UI dev mode automatically calls
`setLoggerEnabled(true)` so you see the SDK's deposit/withdrawal debug
output in the browser console (`src/index.tsx`).

## Working on the SDK locally

If you need to iterate on `cosponsor-contracts/offchain` and have those
changes flow into the UI without re-publishing to npm, swap the npm
dependency for a path-based link:

```jsonc
// cosponsor-ui/package.json
"@dezons/cosponsor-sdk": "link:../cosponsor-contracts/offchain"
```

Then `bun install` and rebuild the SDK with `bun run build` (or
`bun run copy-to-ui` from the SDK side, which also requires
`COSPONSOR_UI_PATH` env var). Switch back to the version-pinned
dependency before merging.

## Releasing a new SDK version

From `cosponsor-contracts/offchain`:

```bash
# Bump version in package.json (e.g. 1.0.0-alpha.1 -> 1.0.0-alpha.2)
npm publish --access public --tag alpha --otp <code>
```

`prepublishOnly` runs `clean && build` automatically. Then bump the UI's
`package.json` to the new version and `bun install`.
