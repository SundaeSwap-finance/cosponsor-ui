import React, { ReactNode, useMemo, useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { InputCurrencyLarge } from '@/components/input/InputCurrencyLarge'
import { IconCardano } from '@/icons/IconCardano'
import { LineOrderDetails } from '@/components/modals/proposalAction/LineOrderDetails'
import { ArrowDownToLine, Fuel, Signature, Vote, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { IProposalCardData } from '@/types/Proposal'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'
import { useWalletObserver } from '@sundaeswap/wallet-lite'
import {
  createBlazeWithBrowserWallet,
  fetchWithdrawalPlan,
  IWithdrawalPlan,
  browserWithdraw,
  createOgmiosEvaluator,
} from '@dezons/cosponsor-sdk/browser'
import { signAndSubmitTransaction } from '@/lib/cardano/transactionSigner'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'

import { Core } from '@blaze-cardano/sdk'
import { getExplorerTxUrl } from '@/lib/cardano/cardanoscan'
import { logger } from '@/lib/logger'

// Get Ogmios URL from environment for script evaluation (has mempool access)
const OGMIOS_URL = import.meta.env.COSPONSOR_OGMIOS_URL as string | undefined

export const ModalWithdraw = ({
  modalTrigger,
  proposal,
}: {
  modalTrigger: ReactNode
  proposal: IProposalCardData
}) => {
  const { formatLovelaceToAdaString, formatNumber } = useNumberFormatter()
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer

  const amountInputRef = useRef<HTMLInputElement>(null)
  const lovelaceToRetrieve: bigint = BigInt(proposal.userPledged * 10 ** 6)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)
  const [previewTx, setPreviewTx] = useState<Core.Transaction | null>(null)
  const [withdrawalPlan, setWithdrawalPlan] = useState<IWithdrawalPlan | null>(null)
  const [fees, setFees] = useState<number>(0)

  // Load transaction preview to calculate accurate fees
  useEffect(() => {
    if (!walletObserver.api || isLoadingPreview || previewTx) {
      return
    }

    const buildPreview = async () => {
      setIsLoadingPreview(true)
      try {
        logger.debug('Building transaction preview to calculate fees...')

        requireConnectedWallet(walletObserver)
        const blaze = await createBlazeWithBrowserWallet(walletObserver)
        const plan = await fetchWithdrawalPlan(blaze)

        if (plan.availableToWithdraw <= 0n) {
          setError('No gADA tokens available to withdraw')
          return
        }

        setWithdrawalPlan(plan)

        // Build preview transaction with full available amount
        let tx = await browserWithdraw({
          blaze,
          withdrawalPlan: plan,
          withdrawAmount: lovelaceToRetrieve,
        })

        // Use Ogmios evaluator if available (has mempool access), otherwise fall back to Blockfrost
        if (OGMIOS_URL) {
          tx = tx.useEvaluator(createOgmiosEvaluator(OGMIOS_URL))
        }
        const completedTx = await tx.complete()

        // Calculate fees
        const txFee = completedTx.body().fee()
        const feeAda = Number(txFee) / 1_000_000

        setFees(feeAda)
        setPreviewTx(completedTx)

        logger.debug(`Transaction fees: ${feeAda} ADA`)
      } catch (err) {
        console.error('Failed to build transaction preview:', err)
        // Don't show error to user for preview failure, just use fallback
        setFees(2.0) // Fallback estimate
      } finally {
        setIsLoadingPreview(false)
      }
    }

    buildPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletObserver.api, proposal.id])
  // Note: isLoadingPreview and previewTx are intentionally NOT in deps
  // They are guard conditions, not trigger conditions

  const largestStringInList = useMemo(() => {
    const result = Math.max(
      formatNumber(proposal.userPledged, maxDecimalsAda).length ?? 0,
      formatNumber(proposal.userPledged, maxDecimalsAda).length ?? 0,
      formatNumber(fees, maxDecimalsAda).length
    )
    return result
  }, [proposal.userPledged, fees, formatNumber])

  const handleWithdraw = async () => {
    if (!walletObserver.api) {
      setError('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setTxHash(null)

    try {
      logger.debug('Starting withdrawal process...')

      // Use preview transaction if available, otherwise build new one
      let completedTx = previewTx

      if (!completedTx) {
        logger.warn('No preview transaction available, building fresh transaction...')

        // Create Blaze instance
        requireConnectedWallet(walletObserver)
        const blaze = await createBlazeWithBrowserWallet(walletObserver)

        // Fetch withdrawal plan
        const plan = withdrawalPlan ?? (await fetchWithdrawalPlan(blaze))

        if (plan.availableToWithdraw <= 0n) {
          throw new Error('No gADA tokens available to withdraw')
        }

        logger.debug(`Withdrawing ${lovelaceToRetrieve / 1_000_000n} ADA`)

        // Build withdrawal transaction
        let tx = await browserWithdraw({
          blaze,
          withdrawalPlan: plan,
          withdrawAmount: lovelaceToRetrieve,
        })

        logger.debug('Withdrawal transaction built, completing...')

        // Complete the transaction (adds change, balances, etc.)
        // Use Ogmios evaluator if available (has mempool access), otherwise fall back to Blockfrost
        logger.debug('Completing transaction (evaluating scripts via Ogmios)...')
        if (OGMIOS_URL) {
          tx = tx.useEvaluator(createOgmiosEvaluator(OGMIOS_URL))
        }
        completedTx = await tx.complete()
      } else {
        logger.debug('Using pre-built transaction from preview')
      }

      // Ensure we have a completed transaction
      if (!completedTx) {
        throw new Error('Failed to build transaction')
      }

      logger.debug('Transaction evaluated, requesting signature from wallet...')

      // Sign and submit (withdraw uses partial sign so script witnesses are preserved)
      const { txHash: submittedTxHash } = await signAndSubmitTransaction({
        walletApi: walletObserver.api,
        completedTx,
        partialSign: true,
      })

      logger.debug(`Withdrawal transaction submitted: ${submittedTxHash}`)

      setTxHash(submittedTxHash)
      setIsProcessing(false)
    } catch (err) {
      console.error('❌ Withdrawal failed:', err)

      // Log error details for debugging
      logger.debug('Withdrawal error details:', {
        type: typeof err,
        message: (err as Error)?.message,
        err,
      })

      let errorMessage = 'Withdrawal failed'
      if (err instanceof Error) {
        errorMessage = err.message

        // Check for specific error types
        if (errorMessage.includes('evaluation failure')) {
          errorMessage =
            'Script evaluation failed. The smart contract rejected this withdrawal. This could be due to an invalid transaction structure or contract logic. Check the console for details.'
        }
      }

      setError(errorMessage)
      setIsProcessing(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{modalTrigger}</DialogTrigger>
      <DialogContentSundae
        className={'w-120 gap-6 rounded-3xl'}
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // Prevent default Radix behaviour (to prevent auto .select on input)
          event.preventDefault()
          amountInputRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Withdraw Your Pledge
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            Deposit your <b>gADA</b> to redeem your full pledge of{' '}
            <b>{formatLovelaceToAdaString(lovelaceToRetrieve)} ADA.</b>
            <br />
            <span className="text-sun-muted text-xs">
              Note: You can only withdraw the full amount at this time.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className={'flex flex-col gap-6'}>
          <InputCurrencyLarge
            ref={amountInputRef}
            label="Full Amount to Withdraw"
            placeholder={'0.0'}
            currencyLabel={'gADA'}
            currencyAvailable={lovelaceToRetrieve}
            defaultValue={proposal.userPledged}
            disabled={true}
            currencyIcon={
              <IconCardano className={'bg-sun-gada fill-sun-white-pure size-6.5 rounded-full'} />
            }
          />
          <div className={'flex flex-col gap-4 px-4'}>
            <div className={'sun-text-16-md text-sun-header'}>
              Order Details
              {isLoadingPreview && (
                <span className="text-sun-muted sun-text-12-rg ml-2">(calculating fees...)</span>
              )}
            </div>
            <div className={'flex flex-col gap-4 md:gap-3'}>
              <LineOrderDetails
                label={`You're Depositing`}
                labelIcon={<Vote />}
                currencyName={'gADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-gada fill-sun-white-pure size-4 rounded-full'} />
                }
                currencyValue={proposal.userPledged}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`You'll receive`}
                labelIcon={<ArrowDownToLine />}
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
                }
                currencyValue={proposal.userPledged}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`Total Fees`}
                labelIcon={<Fuel />}
                labelTooltip={
                  'Cardano network fees are set by the protocol and do not scale with your withdrawal amount.'
                }
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano
                    className={'bg-sun-action-tertiary fill-sun-white-pure size-4 rounded-full'}
                  />
                }
                currencyValue={fees}
                classNameCurrency={'text-sun-default'}
                largestTextInList={largestStringInList}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-sun-action-tertiary/10 border-sun-action-tertiary text-sun-action-tertiary rounded-lg border p-4 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="bg-sun-highlight-primary/10 border-sun-highlight-primary text-sun-highlight-primary rounded-lg border p-4 text-sm">
            <strong>Success!</strong> Withdrawal submitted.
            <br />
            <a
              href={getExplorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on CardanoScan
            </a>
          </div>
        )}

        <DialogFooter className={'border-sun-border-primary border-t pt-6'}>
          <DialogClose asChild>
            <Button
              size="lg"
              variant="secondary"
              className={'sun-text-14-rg h-12 grow'}
              disabled={isProcessing}
              onClick={() => {
                // Don't refresh - allow sequential testing of transactions
                // The page state is preserved to enable testing multiple categories
              }}
            >
              {txHash ? 'Close' : 'Cancel'}
            </Button>
          </DialogClose>
          <Button
            size="lg"
            variant="default"
            className={'sun-text-14-rg h-12 grow'}
            onClick={handleWithdraw}
            disabled={isProcessing || !!txHash}
          >
            {isProcessing ? (
              <>
                <LoaderCircle className="animate-spin" />
                Processing...
              </>
            ) : txHash ? (
              <>
                <Signature />
                Withdrawal Complete
              </>
            ) : (
              <>
                <Signature />
                Confirm Redemption Amount & Sign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
