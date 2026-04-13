# CoSponsor Build & Deployment Guide

## Prerequisites

- [Bun](https://bun.sh/) installed
- Both repositories cloned:
  - `cosponsor-ui` (this repo)
  - `cosponsor-contracts` (SDK + smart contracts)

## Full Build Pipeline

### 1. Build the SDK

```bash
cd cosponsor-contracts/offchain
bun install
bun run build
```

This produces `cosponsor-contracts/offchain/dist/` with the compiled SDK.

### 2. Link the SDK into the UI

The UI's `package.json` references the SDK via a local link:

```json
"@sundaeswap/cosponsor-sdk": "link:@sundaeswap/cosponsor-sdk"
```

Bun resolves this from `node_modules/@sundaeswap/cosponsor-sdk`. After cloning, you need to set up the link:

```bash
cd cosponsor-ui

# Option A: symlink (development — picks up SDK changes automatically)
ln -s ../../cosponsor-contracts/offchain node_modules/@sundaeswap/cosponsor-sdk

# Option B: copy (deployment — static snapshot)
rm -rf node_modules/@sundaeswap/cosponsor-sdk
cp -r ../cosponsor-contracts/offchain node_modules/@sundaeswap/cosponsor-sdk
```

Then install remaining dependencies:

```bash
bun install
```

### 3. Configure environment

Copy `.env.example` or create `.env` with:

```env
CARDANO_NETWORK_ID=0
COSPONSOR_APP_ENV=preview
COSPONSOR_BLOCKFROST_NETWORK=preview
COSPONSOR_BLOCKFROST_API_URL=https://cardano-preview.blockfrost.io/api/v0
COSPONSOR_BLOCKFROST_API_KEY=<your-preview-key>
COSPONSOR_SCRIPT_ADDRESS=<cosponsor-script-address>
COSPONSOR_POLICY_ID=<cosponsor-policy-id>
COSPONSOR_OGMIOS_URL=<ogmios-websocket-url>  # optional, for script evaluation
```

### 4. Build the UI

```bash
cd cosponsor-ui
bun vite build
```

Output goes to `dist/` — static files ready to serve.

### 5. Deploy

The `dist/` folder contains a static SPA. Serve with any web server:

```bash
# Quick preview
bun vite preview

# Or serve with nginx, Caddy, etc.
# Point document root to dist/, configure SPA fallback to index.html
```

## Why local build instead of CI?

The SDK is linked locally via filesystem path, not published to npm. A build server would need both repos cloned and linked. Until the SDK is published as a package, building locally and deploying the static `dist/` output is the simplest approach.

## Quick Reference

```bash
# Full rebuild from scratch
cd cosponsor-contracts/offchain && bun install && bun run build
cd ../../cosponsor-ui && bun install && bun vite build

# Dev server
cd cosponsor-ui && bun dev

# Preview mode (testnet)
cd cosponsor-ui && bun dev:preview
```
