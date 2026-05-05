import { config } from '@/lib/config'

// https://docs.gov.tools/participate-in-development/govtool-apis/proposal-pillar-api/access
const API_BASE_URL_MAINNET = 'https://be.pdf.gov.tools/api/'
const API_BASE_URL_PREVIEW = 'https://p1337-zdae9891f-zf09d11da-gtw.z937eb260.rustrocks.fr/api/'

const API_BASE_URL = config.appEnv === 'preview' ? API_BASE_URL_PREVIEW : API_BASE_URL_MAINNET

/**
 * Lightweight fetch wrapper replacing axios. Supports GET requests with
 * query params, JSON parsing, timeouts, and typed responses.
 */
export const govToolsApi = {
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
