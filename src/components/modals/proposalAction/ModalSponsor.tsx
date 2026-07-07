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
  createOgmiosEvaluator,
  computeProposalAssetName,
  BROWSER_CONFIG,
} from '@sundaeswap/cosponsor-sdk/browser'
import { ICosponsoredProposal, GovernanceAction } from '@sundaeswap/cosponsor-sdk/validators'
import { Core } from '@blaze-cardano/sdk'
import { IProposalCardData } from '@/types/Proposal'
import {
  SUPPORTED_ACTION_TYPES,
  buildGovernanceAction,
  mapCategoryToActionKind,
} from '@/lib/cardano/governanceActions'
import { ensureAncestors } from '@/lib/cardano/ancestorsCache'
import { proposalAnchorUrl } from '@/lib/cardano/proposalAnchor'
import { getExplorerTxUrl } from '@/lib/cardano/cardanoscan'
import { signAndSubmitTransaction } from '@/lib/cardano/transactionSigner'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'
import { logger } from '@/lib/logger'

import { config } from '@/lib/config'
import { createConfiguredBlaze } from '@/lib/cardano/blaze'
import { applyPureAdaCollateral } from '@/lib/cardano/collateral'
import { buildChainedTxEvaluator, wrapEvaluatorWithWalletUtxos } from '@/lib/cardano/blaze-patches'
import { useGovActionDeposit } from '@/composables/useGovActionDeposit'
import { invalidateChainPlanCache } from '@/lib/cardano/proposalTotals'

// Ogmios URL from runtime config for script evaluation
const OGMIOS_URL = config.ogmiosUrl

// Fallback used until useGovActionDeposit resolves (100,000 ADA in lovelace).
// Matches the Conway protocol param on both preview and mainnet as of 2026-05-22.
const FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE = 100_000_000_000n

// Deposit guard: refuse a mint tx that selected a Cosponsor script UTxO as an
// input (the validator enforces `cosponsor_inputs == 0`). Passed to the evaluator
// so it fails before submit with an actionable message. See blaze-patches.ts.
const DEPOSIT_EVALUATOR_GUARD = {
  rejectCosponsorInputHash: BROWSER_CONFIG.scripts.cosponsor.hash,
}

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
  const { depositLovelace: govActionDepositLovelace } = useGovActionDeposit()
  const [isLoadingFees, setIsLoadingFees] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Build cosponsored proposal from UI proposal data.
  //
  // IMPORTANT: `deposit` here is the gov_action_deposit (constant ~100k ADA),
  // NOT the user's pledge amount. The SDK feeds this field into the PlutusData
  // procedure that gets hashed to produce the gADA token asset name (the
  // on-chain proposal identity). If we put the user's pledge here instead,
  // every different pledge size produces a different proposal hash — which is
  // exactly the bug that made multiple deposits look like "new proposals every
  // time" and stopped pledges from aggregating.
  const buildCosponsoredProposal = (_depositAmount: bigint): ICosponsoredProposal => {
    const procedureDeposit = govActionDepositLovelace ?? FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE

    // Adding to an existing pledge: re-use the on-chain procedure verbatim
    // (recovered by getProposalCardsUserPledge). Rebuilding from card-level
    // fields drops action-specific data (TreasuryWithdrawal.withdrawals,
    // HardFork.version, NewConstitution.hash/url), which hashes to a
    // different proposal token and surfaces as "Sponsor sponsored the wrong
    // proposal" / "created a new proposal entry."
    if (proposal?.existingCosponsoredProposal) {
      return proposal.existingCosponsoredProposal
    }

    if (proposal) {
      const actionKind = mapCategoryToActionKind(proposal.categoryName || 'NicePoll')

      // Anchor URL uses `sourceUrlId` (mock id / GovTools id), NOT `id` —
      // post-Stage-2 the latter IS the on-chain hash of the procedure
      // we're constructing here. Using it in the anchor would make the
      // hash depend on itself. `proposalIdentity.ts` documents the
      // convention; we mirror it on every mint path so the procedure is
      // byte-identical to what the listing factory already hashed.
      const urlIdForAnchor = proposal.sourceUrlId ?? proposal.id

      const rebuilt: ICosponsoredProposal = {
        deposit: procedureDeposit,
        anchor: {
          url: Buffer.from(proposalAnchorUrl(urlIdForAnchor)).toString('hex'),
          hash: urlIdForAnchor.padEnd(64, '0').slice(0, 64),
        },
        action: buildGovernanceAction(actionKind, proposal),
      }

      // Funds-at-stake guard: if the proposal has an on-chain identity
      // (proposalHash present, meaning the card came from chain state OR
      // computeProposalIdentity stamped it), verify the rebuilt procedure
      // hashes to the SAME asset name. A mismatch means we'd mint a
      // different gADA token than the user's existing position — the
      // Pi-review fragmentation bug. Refuse rather than fragment.
      if (proposal.proposalHash) {
        let rebuiltHash: string
        try {
          rebuiltHash = computeProposalAssetName(rebuilt, BROWSER_CONFIG.scripts.cosponsor.hash)
        } catch (error) {
          console.error('[ModalSponsor] hash verification threw', error, {
            id: proposal.id,
            proposalHash: proposal.proposalHash,
          })
          throw new Error(
            "Couldn't verify the rebuilt procedure matches the on-chain proposal. " +
              'Refresh and try again; if the issue persists, please report it.'
          )
        }
        if (rebuiltHash !== proposal.proposalHash) {
          console.error('[ModalSponsor] rebuilt hash differs from on-chain hash', {
            rebuiltHash,
            onChainHash: proposal.proposalHash,
            id: proposal.id,
            sourceUrlId: proposal.sourceUrlId,
            categoryName: proposal.categoryName,
            hasWithdrawals: !!proposal.withdrawals?.length,
            hasHardForkVersion: !!proposal.hardForkVersion,
            hasConstitutionData: !!(proposal.constitutionHash || proposal.constitutionUrl),
          })
          throw new Error(
            "Couldn't rebuild this proposal's on-chain procedure exactly. Pledging " +
              'now would mint a different gADA token than your existing position. ' +
              "Refresh the page and try again — if the issue persists, the SDK can't " +
              'reconstruct this action variant and we need to fix that before you ' +
              'can pledge more.'
          )
        }
      } else if (proposal.userPledged > 0) {
        // The user holds an on-chain position on this proposal, the verbatim
        // on-chain procedure wasn't recovered (no existingCosponsoredProposal),
        // AND there's no proposalHash to verify the rebuild against. Minting
        // unverified here is exactly the duplicate-token window the guard
        // above closes — refuse instead of risking position fragmentation.
        console.error('[ModalSponsor] refusing unverifiable rebuild with existing pledge', {
          id: proposal.id,
          sourceUrlId: proposal.sourceUrlId,
          userPledged: proposal.userPledged,
        })
        throw new Error(
          'This proposal has an existing pledge from you, but its on-chain identity ' +
            "couldn't be verified. Refresh the page and try again — pledging now " +
            'could split your position across two proposal tokens.'
        )
      }

      return rebuilt
    }

    // Fallback to test data if no proposal provided
    return {
      deposit: procedureDeposit,
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
  // (HardFork is deliberately disabled — see DISABLED_ACTION_TYPES)
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
        const blaze = await createConfiguredBlaze(walletObserver)

        const depositAmount = BigInt(Math.floor(userPledging * 1_000_000))
        // Ancestor cache must be warm before building ancestor-threading
        // actions (NoConfidence / ConstitutionalCommittee) — see ancestorsCache.
        await ensureAncestors()
        const cosponsoredProposal = buildCosponsoredProposal(depositAmount)

        let txBuilder = await browserDeposit({ blaze, cosponsoredProposal, depositAmount })
        // Same wallet-aware evaluator as the real-sponsor path below — see
        // `blaze-patches.ts` `wrapEvaluatorWithWalletUtxos` for the chained-
        // tx rationale. The `as never` cast bridges the @cardano-sdk/core
        // version-skew between the UI tree and the SDK-linked tree (same
        // tech-debt as `useGetProposalData`'s blaze cast).
        type TUseEvaluatorArg = Parameters<typeof txBuilder.useEvaluator>[0]
        if (OGMIOS_URL) {
          txBuilder = txBuilder.useEvaluator(
            wrapEvaluatorWithWalletUtxos(
              blaze,
              createOgmiosEvaluator(OGMIOS_URL),
              DEPOSIT_EVALUATOR_GUARD
            ) as unknown as TUseEvaluatorArg
          )
        } else {
          txBuilder = txBuilder.useEvaluator(
            buildChainedTxEvaluator(blaze, DEPOSIT_EVALUATOR_GUARD) as unknown as TUseEvaluatorArg
          )
        }
        txBuilder = await applyPureAdaCollateral(txBuilder, blaze)
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

      // Create the cosponsored proposal with user's pledge amount (ancestor
      // cache first — the resolved ancestor is baked into the gADA identity)
      await ensureAncestors()
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
      const blaze = await createConfiguredBlaze(walletObserver)

      // Build the deposit transaction using browser-compatible function
      logger.debug('Building deposit transaction...')
      let txBuilder = await browserDeposit({ blaze, cosponsoredProposal, depositAmount })

      // Inject wallet UTxOs into the evaluator's additionalUtxos so chained
      // transactions resolve even when Blockfrost hasn't indexed the
      // previous tx's change output yet. See `blaze-patches.ts` for the
      // chained-tx wrapper rationale.
      type TUseEvaluatorArg = Parameters<typeof txBuilder.useEvaluator>[0]
      if (OGMIOS_URL) {
        txBuilder = txBuilder.useEvaluator(
          wrapEvaluatorWithWalletUtxos(
            blaze,
            createOgmiosEvaluator(OGMIOS_URL),
            DEPOSIT_EVALUATOR_GUARD
          ) as unknown as TUseEvaluatorArg
        )
      } else {
        txBuilder = txBuilder.useEvaluator(
          buildChainedTxEvaluator(blaze, DEPOSIT_EVALUATOR_GUARD) as unknown as TUseEvaluatorArg
        )
      }

      txBuilder = await applyPureAdaCollateral(txBuilder, blaze)

      // Complete the transaction
      logger.debug('Completing transaction...')
      let completedTx: Core.Transaction | null = null
      try {
        // `txBuilder.complete()` returns a Transaction class instance from
        // the SDK's nested `@cardano-sdk/core` (0.45) tree; this file's
        // `Core.Transaction` is the UI's pinned 0.46.12. Structurally
        // identical at runtime — TS rejects only on the `#private` field
        // identity check. See TODO.md "Tech Debt: Blaze Override Stack".
        completedTx = (await txBuilder.complete()) as unknown as Core.Transaction
        logger.debug('✅ Transaction completed successfully!')
      } catch (evalError) {
        console.error('Transaction evaluation failed:', evalError)

        // Branch on the structured Ogmios v5 error surfaced by
        // `blaze-patches.ts`. The patch emits a single-line message in the
        // form:
        //   "evaluateTransaction: Ogmios v5 EvaluationFailure | validator=<purpose>#<i> | reason: <json> | MissingInputs: <json> | Unknown transaction input (missing from UTxO set)"
        // and reuses the legacy "missing from UTxO set" / "Unknown
        // transaction input" tokens so the matching below stays robust if
        // the patch is ever flipped back to v6.
        const errMsg = evalError instanceof Error ? evalError.message : String(evalError)

        // Stale-UTxO family: tx references an input the evaluator can't
        // find in the on-chain set or the additionalUtxoset we passed.
        if (
          errMsg.includes('missing from UTxO set') ||
          errMsg.includes('Unknown transaction input') ||
          errMsg.includes('MissingInputs') ||
          errMsg.includes('AdditionalUtxoOverlap') ||
          errMsg.includes('IncompleteUtxoSet')
        ) {
          throw new Error(
            'A referenced UTxO is no longer available on-chain. ' +
              'This can happen if your wallet state is stale, or if the cosponsor ' +
              'script reference UTxO was spent. Please refresh the page and try again.'
          )
        }

        // Script-rejection family: validator ran on-chain and returned
        // `error`. v5 reports this as `ScriptFailures` containing
        // `validatorFailed`; the patch lifts that into the message
        // alongside a `validator=<purpose>#<i>` tag.
        if (
          errMsg.includes('Ogmios v5 EvaluationFailure') &&
          (errMsg.includes('validatorFailed') || errMsg.includes('ScriptFailures'))
        ) {
          throw new Error(
            'The cosponsor script rejected this transaction. This usually means ' +
              "the procedure data we're minting doesn't exactly match the existing " +
              "proposal's on-chain procedure. Try refreshing the page; if it " +
              `persists, capture the full error and report it. (Raw: ${errMsg})`
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

        // The script-address state just changed — drop the cached chain plan
        // so the next page load sees this deposit instead of the pre-submit
        // snapshot still inside the TTL window.
        invalidateChainPlanCache()

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
            // Block until the amount is a positive number — `!(x > 0)` also
            // catches 0, empty (NaN), and negative inputs.
            disabled={isProcessing || !!txHash || !(userPledging > 0)}
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
