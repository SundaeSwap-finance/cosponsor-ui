import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { defineConfig, PluginOption } from 'vite'
import checker from 'vite-plugin-checker'
import { nodePolyfills, PolyfillOptions } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// 'assert' + 'buffer': @aiken-lang/merkle-patricia-forestry (the propose
// flow's MPF proof builder) imports node:assert / node:buffer directly —
// without the module polyfills its assert calls arrive as non-callable
// shims ("G is not a function" at Trie construction in production).
const polyfills: PolyfillOptions['include'] = [
  'assert',
  'buffer',
  'stream',
  'util',
  'crypto',
  'path',
  'vm',
]

if (process.env.NODE_ENV === 'production') {
  polyfills.push('fs')
}

const plugins: PluginOption[] = [
  wasm(),
  topLevelAwait(),
  injectConfig(),
  tailwindcss(),
  nodePolyfills({
    globals: {
      Buffer: true,
      global: true,
      process: true,
    },
    include: polyfills,
  }),
  react(),
]

if (process.env.NODE_ENV === 'development') {
  plugins.push(
    checker({
      typescript: true,
      overlay: false,
      root: 'src',
    })
  )
}

export default defineConfig({
  // Expose COSPONSOR_ prefixed env vars to the client
  envPrefix: ['COSPONSOR_'],
  server: {
    watch: {
      followSymlinks: true,
    },
  },
  define: {
    appConfig: process.env.APP_ENV
      ? await import(`./config/${process.env.APP_ENV}.json`).then((res) => JSON.stringify(res))
      : undefined,
    buildConfig: JSON.stringify({
      commitHash: process.env.COMMIT_HASH ?? '',
      buildId: process.env.VERSION ?? '',
      buildDate: Date.now(),
    }),
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      'uplc-node': 'uplc-web',
      'node:stream/web': 'stream-browserify',
      'stream/web': 'stream-browserify',
      ws: path.resolve(__dirname, './src/shims/ws.ts'),
      // The linked @sundaeswap/cosponsor-sdk imports
      // `@scure/bip39/wordlists/english.js` with an explicit `.js` extension,
      // but @scure/bip39@1.5.4 only exposes `./wordlists/english` in its
      // exports map — so subpath resolution rejects the `.js` form. Map it
      // directly to the ESM file on disk until the SDK drops the extension.
      '@scure/bip39/wordlists/english.js': path.resolve(
        __dirname,
        'node_modules/@scure/bip39/esm/wordlists/english.js'
      ),
      '@': path.resolve(__dirname, './src'),
      // "@emurgo/cardano-message-signing-nodejs":
      //   "@emurgo/cardano-message-signing-browser",
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      supported: {
        'top-level-await': true,
      },
    },
  },
  esbuild: {
    target: 'esnext',
    sourcemap: process.env.NODE_ENV !== 'production' ? true : 'external',
  },
  publicDir: 'static',
  logLevel: 'info',
  build: {
    sourcemap: process.env.NODE_ENV !== 'production' ? true : 'hidden',
    target: 'esnext',
    rollupOptions: {
      external: ['node-fetch', '@peculiar/webcrypto'],
      output: {
        // Customize the output chunking
        manualChunks(id) {
          if (id.endsWith('index.ts')) {
            return null
          }

          if (id.endsWith('.json')) {
            return 'json'
          }
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entry/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

function injectConfig() {
  return {
    name: 'html-config-injector',
    transformIndexHtml(html: string) {
      const appEnv = process.env.APP_ENV || 'dev'
      const configPath = path.resolve(__dirname, `./config/${appEnv}.json`)
      const baseConfig = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }))

      // Mirror the env-var override layering done by
      // `scripts/interpolate-index.mjs` so the dev server picks up the
      // same overrides a deploy would. Keep this list in sync with both
      // files and with `IAppConfig` in `src/lib/config.ts`.
      const envOverrides: Record<string, string | undefined> = {
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
      const config = JSON.stringify(baseConfig)

      return html.replace(
        '<head>',
        `<head>
        <script>
          window.__APP_CONFIG = ${
            process.env.NODE_ENV === 'production' ? '@@APP_CONFIG@@' : config
          };
          window.__BUILD_CONFIG = ${JSON.stringify({
            commitHash: process.env.COMMIT_HASH ?? '',
            buildId: process.env.VERSION ?? '',
            buildDate: Date.now(),
          })}
        </script>`
      )
    },
  }
}
