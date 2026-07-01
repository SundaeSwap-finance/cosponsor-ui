import { config } from '@/lib/config'

const API_BASE_URL_MAINNET = 'https://api.cosponsor.sundae.fi/'
const API_BASE_URL_PREVIEW = 'https://api.cosponsor.preview.sundae.fi/'

const API_BASE_URL = config.appEnv === 'preview' ? API_BASE_URL_PREVIEW : API_BASE_URL_MAINNET

/**
 * Lightweight fetch wrapper replacing axios. Supports GET requests with
 * query params, JSON parsing, timeouts, and typed responses.
 */
export const cosponsorApi = {
  async get<T>(
    path: string,
    options?: { params?: Record<string, string | number> }
  ): Promise<{ data: T }> {
    const url = new URL(path, API_BASE_URL)
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value))
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as T
      return { data }
    } finally {
      clearTimeout(timeout)
    }
  },
}
