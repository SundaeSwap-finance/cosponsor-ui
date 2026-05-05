/**
 * Centralized logger that only emits in development.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.debug('Building transaction...', { amount })
 *   logger.info('Transaction submitted', txHash)
 *   logger.warn('Fallback data used')
 *
 * In production builds Vite replaces `import.meta.env.DEV` with `false`,
 * allowing tree-shaking to strip all debug/info/warn calls entirely.
 */

const isDev = import.meta.env.DEV

/* eslint-disable no-console */
export const logger = {
  debug: isDev
    ? (...args: unknown[]) => console.log(...args)
    : () => {
        // stripped in production
      },

  info: isDev
    ? (...args: unknown[]) => console.log(...args)
    : () => {
        // stripped in production
      },

  warn: isDev
    ? (...args: unknown[]) => console.warn(...args)
    : () => {
        // stripped in production
      },
}
/* eslint-enable no-console */
