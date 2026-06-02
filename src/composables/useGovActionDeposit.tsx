import { useEffect, useState } from 'react'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

// Live value of the Conway gov_action_deposit protocol parameter. This is the
// lovelace amount someone has to lock when submitting a governance action — i.e.
// the target a cosponsor pool is trying to crowdfund. Verified on preview
// 2026-05-21: 100_000_000_000 lovelace (100,000 ADA).
//
// Module-level cache + in-flight promise so concurrent hook subscribers share
// one network request and consumers outside React (mock factories, etc.) can
// read the cached value synchronously once it's resolved.
let cachedLovelace: bigint | null = null
let inFlight: Promise<bigint> | null = null

interface IBlockfrostParamsResponse {
  gov_action_deposit?: string | number
}

async function fetchGovActionDeposit(): Promise<bigint> {
  if (cachedLovelace !== null) {
    return cachedLovelace
  }
  if (inFlight) {
    return inFlight
  }

  inFlight = (async () => {
    const url = `${config.blockfrostApiUrl}/epochs/latest/parameters`
    const response = await fetch(url, {
      headers: { project_id: config.blockfrostApiKey },
    })
    if (!response.ok) {
      throw new Error(`Blockfrost parameters fetch failed: ${response.status}`)
    }
    const json = (await response.json()) as IBlockfrostParamsResponse
    const raw = json.gov_action_deposit
    if (raw === undefined || raw === null) {
      throw new Error('Blockfrost parameters response missing gov_action_deposit')
    }
    const value = BigInt(raw)
    cachedLovelace = value
    return value
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

export const getCachedGovActionDepositAda = (): number | null =>
  cachedLovelace === null ? null : Number(cachedLovelace) / 1_000_000

// Lovelace flavour for callers that feed the deposit directly into PlutusData
// (`browserDeposit` / `computeProposalAssetName`). Avoids the round-trip to ADA
// and back, and the precision loss that comes with it.
export const getCachedGovActionDepositLovelace = (): bigint | null => cachedLovelace

// Async equivalent of `getCachedGovActionDepositAda` that triggers the fetch
// if the cache hasn't been populated yet (e.g. when the data layer runs
// before any React component has mounted `useGovActionDeposit`). Returns
// null on failure so the caller can leave the target undefined rather than
// blocking the listing.
export const ensureGovActionDepositAda = async (): Promise<number | null> => {
  if (cachedLovelace !== null) {
    return Number(cachedLovelace) / 1_000_000
  }
  try {
    const lovelace = await fetchGovActionDeposit()
    return Number(lovelace) / 1_000_000
  } catch (err) {
    logger.warn('Failed to ensure gov_action_deposit:', err)
    return null
  }
}

export interface IGovActionDepositState {
  depositLovelace: bigint | null
  depositAda: number | null
  isLoading: boolean
  error: Error | null
}

export const useGovActionDeposit = (): IGovActionDepositState => {
  const [state, setState] = useState<IGovActionDepositState>(() => ({
    depositLovelace: cachedLovelace,
    depositAda: cachedLovelace === null ? null : Number(cachedLovelace) / 1_000_000,
    isLoading: cachedLovelace === null,
    error: null,
  }))

  useEffect(() => {
    if (cachedLovelace !== null) {
      return
    }

    let cancelled = false
    fetchGovActionDeposit()
      .then((lovelace) => {
        if (cancelled) {
          return
        }
        setState({
          depositLovelace: lovelace,
          depositAda: Number(lovelace) / 1_000_000,
          isLoading: false,
          error: null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return
        }
        const error = err instanceof Error ? err : new Error(String(err))
        logger.warn('Failed to fetch gov_action_deposit from Blockfrost:', error)
        setState((prev) => ({ ...prev, isLoading: false, error }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
