import type { Blaze, Provider, Wallet } from '@blaze-cardano/sdk'
import { logger } from '@/lib/logger'

// Collateral only needs ~`collateralPercent` of the fee (a few ADA), but we
// want comfortable headroom and a clean ADA-only UTxO.
const COLLATERAL_MIN_LOVELACE = 5_000_000n

// Structural view of the two Blaze TxBuilder methods we use. Avoids importing
// the SDK's nested @blaze-cardano/tx type (version-skew, see TODO.md "Tech
// Debt: Blaze Override Stack").
interface ICollateralBuilder {
  setCollateralChangeAddress: (address: unknown) => unknown
  provideCollateral: (utxos: unknown[]) => unknown
}

/**
 * DECISION (2026-06-22, Pi + Mark): transaction collateral must be **pure ADA**.
 *
 * Why: collateral is consumed only if a transaction fails phase-2 (script)
 * validation. A Babbage collateral-return output preserves any non-ADA tokens
 * even in that case, but we still avoid routing tokens through collateral at
 * all — it keeps the failure path simple and auditable and prevents surprises
 * (e.g. a gADA-bearing UTxO being locked as collateral, which the ledger
 * rejects outright as error 3133 when no return is set).
 *
 * Strategy, applied right before `complete()` on deposit/withdraw builds:
 *   1. Set a collateral-change address as a safety net — guarantees the ledger
 *      returns surplus ADA + ALL tokens to the user if a token-bearing UTxO is
 *      ever used as collateral (so tokens are never lost), and fixes 3133.
 *   2. Prefer pinning an ADA-only wallet UTxO (>= COLLATERAL_MIN_LOVELACE) via
 *      `provideCollateral`, so in the normal case tokens never touch collateral.
 *
 * If the SDK's browser tx builders adopt this internally, drop the call sites.
 */
export const applyPureAdaCollateral = async <T>(
  tx: T,
  blaze: Blaze<Provider, Wallet>
): Promise<T> => {
  const builder = tx as unknown as ICollateralBuilder
  const changeAddress = await blaze.wallet.getChangeAddress()

  // (1) Safety net first — never depend on a clean UTxO existing.
  let next = builder.setCollateralChangeAddress(changeAddress) as ICollateralBuilder

  // (2) Prefer an ADA-only UTxO so tokens stay off the collateral input.
  const utxos = await blaze.wallet.getUnspentOutputs()
  const pureAdaUtxo = utxos.find((utxo) => {
    const value = utxo.output().amount()
    const multiasset = value.multiasset()
    return (!multiasset || multiasset.size === 0) && value.coin() >= COLLATERAL_MIN_LOVELACE
  })

  if (pureAdaUtxo) {
    next = next.provideCollateral([pureAdaUtxo]) as ICollateralBuilder
    logger.debug('Pinned a pure-ADA collateral UTxO')
  } else {
    logger.warn(
      'No pure-ADA collateral UTxO available; relying on the collateral-return output for any token surplus'
    )
  }

  return next as unknown as T
}
