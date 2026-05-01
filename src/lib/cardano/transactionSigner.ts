import { Core } from '@blaze-cardano/sdk'
import { extractTransactionEffects, pendingUtxoTracker } from '@dezons/cosponsor-sdk/browser'
import type { Cip30WalletApi } from '@cardano-sdk/dapp-connector'

export interface ISignAndSubmitParams {
  /** CIP-30 wallet API obtained from useWalletObserver().api */
  walletApi: Cip30WalletApi
  /** Completed transaction returned from blaze TxBuilder.complete() */
  completedTx: Core.Transaction
  /**
   * If true, request a partial signature (allows scripts to remain unsigned).
   * Sponsor uses false (full sign), Withdraw uses true (partial sign).
   */
  partialSign?: boolean
}

export interface ISignAndSubmitResult {
  /** The on-chain transaction hash returned by the wallet's submitTx call */
  txHash: string
  /** The signed transaction CBOR (kept for callers that want to log/inspect it) */
  signedTxCbor: string
}

/**
 * Sign a completed transaction with the connected wallet, combine the wallet's
 * vkey witnesses with the transaction's existing witness set (which may contain
 * redeemers, native scripts, etc.), submit it to the chain via the wallet, and
 * record the spent/created UTxOs in the pending UTxO tracker for tx chaining.
 *
 * Both ModalSponsor and ModalWithdraw use this — they only differ in `partialSign`.
 */
export const signAndSubmitTransaction = async ({
  walletApi,
  completedTx,
  partialSign = false,
}: ISignAndSubmitParams): Promise<ISignAndSubmitResult> => {
  // Get the transaction's existing witness set (contains redeemers, native scripts, etc.)
  // BEFORE signing to match the original ModalWithdraw ordering — defensive choice in
  // case any wallet implementation has side effects on the Transaction reference.
  const txWitnessSet = completedTx.witnessSet()

  // Sign with wallet
  const witnessSetHex = await walletApi.signTx(completedTx.toCbor(), partialSign)

  // Parse wallet's witness set (has vkey witnesses/signatures).
  // The wallet API returns a plain hex string; brand it as HexBlob for the typed API.
  const walletWitnessSet = Core.TransactionWitnessSet.fromCbor(Core.HexBlob(witnessSetHex))

  // Combine vkey witnesses into the existing witness set
  const vkeyWitnesses = walletWitnessSet.vkeys()
  if (vkeyWitnesses && vkeyWitnesses.size() > 0) {
    txWitnessSet.setVkeys(vkeyWitnesses)
  }

  // Create the signed transaction with combined witness set, preserving auxiliary
  // data (CIP-25 metadata, etc.) from the original transaction
  const signedTx = new Core.Transaction(
    completedTx.body(),
    txWitnessSet,
    completedTx.auxiliaryData()
  )

  const signedTxCbor = signedTx.toCbor()

  // Submit via wallet
  const txHash = await walletApi.submitTx(signedTxCbor)

  // Track effects so subsequent transactions can chain off this one before it
  // is confirmed on-chain
  const { spentInputs, createdOutputs } = extractTransactionEffects(completedTx, txHash)
  pendingUtxoTracker.recordTransaction(txHash, spentInputs, createdOutputs)

  return { txHash, signedTxCbor }
}
