import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { defineConfig, PluginOption } from 'vite'
import checker from 'vite-plugin-checker'
import { nodePolyfills, PolyfillOptions } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

const polyfills: PolyfillOptions['include'] = ['stream', 'util', 'crypto', 'path', 'vm']

if (process.env.NODE_ENV === 'production') {
  polyfills.push('fs')
}

const plugins: PluginOption[] = [
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
      external: ['node-fetch', '@peculiar/webcrypto', 'ws'],
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
      const config = fs.readFileSync(configPath, { encoding: 'utf8' })

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
