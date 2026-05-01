import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import React, { ReactNode, useMemo, useRef, useState, useEffect } from 'react'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { Button } from '@/components/shadcn/button'
import { ArrowDownToLine, Fuel, Signature, Vote, LoaderCircle } from 'lucide-react'
import { LineOrderDetails } from '@/components/modals/proposalAction/LineOrderDetails'
import { IconCardano } from '@/icons/IconCardano'
import { InputCurrencyLarge } from '@/components/input/InputCurrencyLarge'
import { useWalletObserver } from '@sundaeswap/wallet-lite'

import {
  browserDeposit,
  createBlazeWithBrowserWallet,
  createOgmiosEvaluator,
} from '@dezons/cosponsor-sdk/browser'
import { ICosponsoredProposal, GovernanceAction } from '@dezons/cosponsor-sdk/validators'
import { Core } from '@blaze-cardano/sdk'
import { IProposalCardData } from '@/types/Proposal'
import {
  SUPPORTED_ACTION_TYPES,
  buildGovernanceAction,
  mapCategoryToActionKind,
} from '@/lib/cardano/governanceActions'
import { getExplorerTxUrl } from '@/lib/cardano/cardanoscan'
import { signAndSubmitTransaction } from '@/lib/cardano/transactionSigner'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'
import { logger } from '@/lib/logger'

// Ogmios URL from environment for script evaluation
const OGMIOS_URL = import.meta.env.COSPONSOR_OGMIOS_URL as string

export interface IModalSponsorProps {
  modalTrigger: ReactNode
  /** The proposal to sponsor. If not provided, uses test data. */
  proposal?: IProposalCardData
}

export const ModalSponsor = ({ modalTrigger, proposal }: IModalSponsorProps) => {
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer
  const amountInputRef = useRef<HTMLInputElement>(null)

  const [userPledging, setUserPledging] = useState<number>(0.0)
  const [userReceive, setUserReceive] = useState<number>(0.0)
  const [fees, setFees] = useState<number>(0.0)
  const [isLoadingFees, setIsLoadingFees] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Build cosponsored proposal from UI proposal data
  const buildCosponsoredProposal = (depositAmount: bigint): ICosponsoredProposal => {
    if (proposal) {
      // Use actual proposal data
      // The proposal ID is the hash of the cosponsored proposal procedure
      // For governance action kind, map from categoryName to valid Aiken type
      const actionKind = mapCategoryToActionKind(proposal.categoryName || 'NicePoll')

      return {
        deposit: depositAmount,
        anchor: {
          // Use proposal ID as a unique identifier in the URL
          url: Buffer.from(`https://cosponsor.app/proposal/${proposal.id}`).toString('hex'),
          // Use proposal ID as the anchor hash (it's already a hash)
          hash: proposal.id.padEnd(64, '0').slice(0, 64),
        },
        action: buildGovernanceAction(actionKind, proposal),
      }
    }

    // Fallback to test data if no proposal provided
    return {
      deposit: depositAmount,
      anchor: {
        url: Buffer.from('https://governance.cardano.org/test-proposal.json').toString('hex'),
        hash: '0000000000000000000000000000000000000000000000000000000000000000',
      },
      action: {
        kind: 'NicePoll',
      } as GovernanceAction.TGovernanceAction,
    }
  }

  const onInputChanged = (value: number) => {
    setUserPledging(value)
    setUserReceive(value)
  }

  // Check if proposal action type is supported for cosponsoring
  // All 7 governance action types are now supported
  const isActionTypeSupported = useMemo(() => {
    if (!proposal?.categoryName) {
      return true
    } // Default to true if no proposal
    try {
      const actionKind = mapCategoryToActionKind(proposal.categoryName)
      return SUPPORTED_ACTION_TYPES.includes(actionKind)
    } catch {
      return false
    }
  }, [proposal?.categoryName])

  // Build transaction preview to calculate accurate fees when amount changes
  useEffect(() => {
    // Skip if no amount, wallet not connected, or action type not supported
    if (!userPledging || userPledging <= 0 || !walletObserver.api || !isActionTypeSupported) {
      // Use fallback fee estimate for unsupported action types
      if (!isActionTypeSupported) {
        setFees(2.5)
      }
      return
    }

    // Debounce the preview building (wait for user to stop typing)
    const timeoutId = setTimeout(async () => {
      setIsLoadingFees(true)
      try {
        logger.debug(`📊 Building transaction preview for ${userPledging} ADA to calculate fees...`)

        requireConnectedWallet(walletObserver)
        const blaze = await createBlazeWithBrowserWallet(walletObserver)

        const depositAmount = BigInt(Math.floor(userPledging * 1_000_000))
        const cosponsoredProposal = buildCosponsoredProposal(depositAmount)

        let txBuilder = await browserDeposit({ blaze, cosponsoredProposal, depositAmount })
        // Use Ogmios evaluator if available (has mempool access)
        if (OGMIOS_URL) {
          txBuilder = txBuilder.useEvaluator(createOgmiosEvaluator(OGMIOS_URL))
        }
        const completedTx = await txBuilder.complete()

        // Calculate fees
        const txFee = completedTx.body().fee()
        const feeAda = Number(txFee) / 1_000_000

        setFees(feeAda)

        logger.debug(`💰 Transaction fees: ${feeAda} ADA`)
      } catch (err) {
        console.error('Failed to build transaction preview:', err)
        // Use fallback estimate
        setFees(2.5)
      } finally {
        setIsLoadingFees(false)
      }
    }, 800) // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPledging, walletObserver.api, isActionTypeSupported])

  const handleSponsor = async () => {
    // Validate input amount
    if (!userPledging || userPledging <= 0) {
      setError('Please enter a valid pledge amount')
      return
    }

    // Validate wallet connection
    if (!walletObserver.api) {
      setError('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setTxHash(null)

    try {
      // Convert ADA to lovelace (1 ADA = 1,000,000 lovelace)
      const depositAmount = BigInt(Math.floor(userPledging * 1_000_000))

      // Always build a fresh transaction when clicking Pledge
      // Never use preview transaction - it may have stale UTxOs from a previous action
      logger.debug('🔨 Building fresh transaction (ignoring any preview)...')

      // Create the cosponsored proposal with user's pledge amount
      const cosponsoredProposal = buildCosponsoredProposal(depositAmount)

      logger.debug('Building transaction for deposit:', {
        depositAmount: depositAmount.toString(),
        depositADA: userPledging,
        proposalId: proposal?.id || 'test',
        proposal: cosponsoredProposal,
      })

      // Create Blaze instance with browser wallet
      logger.debug('Creating Blaze instance with browser wallet...')
      requireConnectedWallet(walletObserver)
      const blaze = await createBlazeWithBrowserWallet(walletObserver)

      // Build the deposit transaction using browser-compatible function
      logger.debug('Building deposit transaction...')
      let txBuilder = await browserDeposit({ blaze, cosponsoredProposal, depositAmount })

      // Use Ogmios evaluator if available (has mempool access for pending UTxOs)
      if (OGMIOS_URL) {
        txBuilder = txBuilder.useEvaluator(createOgmiosEvaluator(OGMIOS_URL))
      }

      // Complete the transaction
      logger.debug('Completing transaction...')
      let completedTx: Core.Transaction | null = null
      try {
        completedTx = await txBuilder.complete()
        logger.debug('✅ Transaction completed successfully!')
      } catch (evalError) {
        console.error('Transaction evaluation failed:', evalError)

        // Detect stale UTxO errors and provide a clearer message
        const errMsg = evalError instanceof Error ? evalError.message : String(evalError)
        if (
          errMsg.includes('missing from UTxO set') ||
          errMsg.includes('Unknown transaction input')
        ) {
          throw new Error(
            'A referenced UTxO is no longer available on-chain. ' +
              'This can happen if your wallet state is stale. Please refresh the page and try again.'
          )
        }

        throw evalError
      }

      // Ensure we have a completed transaction
      if (!completedTx) {
        throw new Error('Failed to build transaction')
      }

      // Log the transaction details
      const txCbor = completedTx.toCbor()
      logger.debug('Built transaction:', {
        type: 'deposit',
        depositAmount: depositAmount.toString(),
        depositADA: userPledging,
        txSize: txCbor.length / 2, // CBOR hex length / 2 = bytes
        fees: fees,
      })

      // Prompt wallet to sign and submit the transaction
      logger.debug('Requesting wallet signature...')

      try {
        const { txHash: submittedTxHash } = await signAndSubmitTransaction({
          walletApi: walletObserver.api,
          completedTx,
          partialSign: false,
        })

        logger.debug('✅ Transaction submitted successfully!')
        logger.debug('Transaction hash:', submittedTxHash)
        logger.debug('View on explorer:', getExplorerTxUrl(submittedTxHash))

        setTxHash(submittedTxHash)
        setIsProcessing(false)
      } catch (submitError) {
        console.error('Failed to sign/submit transaction:', submitError)
        throw new Error(
          `Transaction submission failed: ${submitError instanceof Error ? submitError.message : String(submitError)}`
        )
      }
    } catch (e) {
      console.error('Error in handleSponsor:', e)
      if (e instanceof Error) {
        console.error('Error details:', e.message, e.stack)
      }
      setError(e instanceof Error ? e.message : String(e))
      setIsProcessing(false)
    }
  }

  const largestStringInList = useMemo(() => {
    return Math.max(
      userPledging?.toString().length ?? 0,
      userReceive?.toString().length ?? 0,
      fees.toString().length
    )
  }, [userPledging, userReceive, fees])

  return (
    <Dialog
      onOpenChange={(open) => {
        // Reset state when dialog opens to ensure fresh state for each use
        if (open) {
          setTxHash(null)
          setError(null)
          setIsProcessing(false)
        }
      }}
    >
      <DialogTrigger asChild>{modalTrigger}</DialogTrigger>
      <DialogContentSundae
        className={'w-120 gap-6 overflow-x-hidden rounded-3xl'}
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // Prevent default Radix behaviour (to prevent auto .select on input)
          event.preventDefault()
          amountInputRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Pledge your support
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            Sponsor this proposal by choosing how much you'll get back.
          </DialogDescription>
        </DialogHeader>
        <div className={'flex flex-col gap-6'}>
          <InputCurrencyLarge
            ref={amountInputRef}
            onChangeSanitized={onInputChanged}
            label="Amount to Pledge"
            placeholder={'0.0'}
            currencyLabel={'ADA'}
            currencyAvailable={walletHook.adaBalance.amount}
            currencyIcon={
              <IconCardano className={'bg-sun-ada fill-sun-white-pure size-6.5 rounded-full'} />
            }
          />
          <div className={'flex flex-col gap-4 px-4'}>
            <div className={'sun-text-16-md text-sun-header'}>
              Order Details
              {isLoadingFees && (
                <span className="text-sun-muted sun-text-12-rg ml-2">(calculating fees...)</span>
              )}
            </div>
            <div className={'flex flex-col gap-4 md:gap-3'}>
              <LineOrderDetails
                label={`You're Pledging`}
                labelIcon={<Vote />}
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
                }
                currencyValue={userPledging}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`You'll receive`}
                labelIcon={<ArrowDownToLine />}
                currencyName={'gADA'}
                currencyIcon={
                  <IconCardano
                    className={
                      'bg-sun-action-secondary fill-sun-action-primary size-4 rounded-full'
                    }
                  />
                }
                currencyValue={userReceive}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`Total Fees`}
                labelIcon={isLoadingFees ? <LoaderCircle className="animate-spin" /> : <Fuel />}
                labelTooltip={
                  'Cardano network fees are set by the protocol and do not scale with your pledge amount.'
                }
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
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
            <strong>Success!</strong> Your pledge has been submitted.
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
            onClick={() => handleSponsor()}
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
                Pledge Complete
              </>
            ) : (
              <>
                <Signature />
                Confirm Pledge Amount & Sign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
