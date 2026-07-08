import React, { ReactNode, useMemo, useState } from 'react'
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
import { Button } from '@/components/shadcn/button'
import { Fuel, Send, Signature, Target, Vote, LoaderCircle, ShieldCheck } from 'lucide-react'
import { LineOrderDetails } from '@/components/modals/proposalAction/LineOrderDetails'
import { IconCardano } from '@/icons/IconCardano'
import { useWalletObserver } from '@sundaeswap/wallet-lite'

// NOTE: `browserPropose` is the new SDK entrypoint that builds AND completes the
// on-chain governance-action submission, spending the pooled cosponsor UTxOs. It
// returns an already-complete, CBOR-spliced `Core.Transaction`. The SDK splices
// raw CBOR so the governance procedure bytes are byte-exact; blaze's structured
// serializer would re-encode them differently and change the transaction id. See
// the exact-CBOR signing note in `handlePropose` below.
import {
  browserPropose,
  computeProposalAssetName,
  BROWSER_CONFIG,
} from '@sundaeswap/cosponsor-sdk/browser'
import { ICosponsoredProposal, GovernanceAction } from '@sundaeswap/cosponsor-sdk/validators'
import { Core } from '@blaze-cardano/sdk'
import { IProposalCardData } from '@/types/Proposal'
import { assertAncestorCurrent, blockfrostStateChainQueries } from '@sundaeswap/cosponsor-sdk/utils'
import { config } from '@/lib/config'
import { buildGovernanceAction, mapCategoryToActionKind } from '@/lib/cardano/governanceActions'
import { ensureAncestorsForKind, koiosBaseUrl } from '@/lib/cardano/ancestorsCache'
import { proposalAnchorUrl } from '@/lib/cardano/proposalAnchor'
import { getExplorerTxUrl } from '@/lib/cardano/cardanoscan'
import { signAndSubmitTransaction } from '@/lib/cardano/transactionSigner'
import { requireConnectedWallet } from '@/lib/cardano/walletGuard'
import { logger } from '@/lib/logger'
import { createConfiguredBlaze } from '@/lib/cardano/blaze'
import { useGovActionDeposit } from '@/composables/useGovActionDeposit'
import { invalidateChainPlanCache } from '@/lib/cardano/proposalTotals'
import { clearProposalsCache } from '@/api/proposalsApi'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

// Fallback used until useGovActionDeposit resolves (100,000 ADA in lovelace).
// Matches the Conway protocol param on both preview and mainnet as of 2026-05-22.
const FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE = 100_000_000_000n

export interface IModalProposeProps {
  modalTrigger: ReactNode
  /** The funded proposal to submit on-chain. */
  proposal?: IProposalCardData
}

export const ModalPropose = ({ modalTrigger, proposal }: IModalProposeProps) => {
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer
  const { formatNumber } = useNumberFormatter()
  const { depositLovelace: govActionDepositLovelace } = useGovActionDeposit()

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Build the cosponsored proposal from the card data. This mirrors
  // ModalSponsor.buildCosponsoredProposal EXACTLY — the on-chain procedure we
  // submit here must be byte-identical to the one that was pledged against, or
  // the pooled gADA tokens won't match and the script will reject the spend.
  //
  // IMPORTANT: `deposit` is the gov_action_deposit (constant ~100k ADA), NOT the
  // pooled pledge. The SDK feeds this field into the PlutusData procedure hashed
  // to produce the gADA token asset name (the on-chain proposal identity). Using
  // any other value here produces a different proposal hash than the pledges.
  const buildCosponsoredProposal = (): ICosponsoredProposal => {
    const procedureDeposit = govActionDepositLovelace ?? FALLBACK_GOV_ACTION_DEPOSIT_LOVELACE

    // Submitting an existing on-chain proposal: re-use the recovered procedure
    // verbatim. Rebuilding from card-level fields drops action-specific data
    // (TreasuryWithdrawal.withdrawals, HardFork.version, NewConstitution.hash/url)
    // which hashes to a different proposal token than the pool holds.
    if (proposal?.existingCosponsoredProposal) {
      return proposal.existingCosponsoredProposal
    }

    if (proposal) {
      const actionKind = mapCategoryToActionKind(proposal.categoryName || 'NicePoll')

      // Anchor URL uses `sourceUrlId` (mock id / GovTools id), NOT `id` —
      // post-Stage-2 the latter IS the on-chain hash of the procedure we're
      // constructing here. Using it in the anchor would make the hash depend
      // on itself. Mirrors ModalSponsor / proposalIdentity.ts.
      const urlIdForAnchor = proposal.sourceUrlId ?? proposal.id

      const rebuilt: ICosponsoredProposal = {
        deposit: procedureDeposit,
        anchor: {
          url: Buffer.from(proposalAnchorUrl(urlIdForAnchor)).toString('hex'),
          hash: urlIdForAnchor.padEnd(64, '0').slice(0, 64),
        },
        action: buildGovernanceAction(actionKind, proposal),
      }

      // Funds-at-stake guard: if the proposal has an on-chain identity, verify
      // the rebuilt procedure hashes to the SAME asset name as the pool holds.
      // A mismatch means we'd submit a different action than the one funded —
      // refuse rather than risk spending the pool on the wrong procedure.
      if (proposal.proposalHash) {
        let rebuiltHash: string
        try {
          rebuiltHash = computeProposalAssetName(rebuilt, BROWSER_CONFIG.scripts.cosponsor.hash)
        } catch (hashError) {
          console.error('[ModalPropose] hash verification threw', hashError, {
            id: proposal.id,
            proposalHash: proposal.proposalHash,
          })
          throw new Error(
            "Couldn't verify the rebuilt procedure matches the on-chain proposal. " +
              'Refresh and try again; if the issue persists, please report it.'
          )
        }
        if (rebuiltHash !== proposal.proposalHash) {
          console.error('[ModalPropose] rebuilt hash differs from on-chain hash', {
            rebuiltHash,
            onChainHash: proposal.proposalHash,
            id: proposal.id,
            sourceUrlId: proposal.sourceUrlId,
            categoryName: proposal.categoryName,
          })
          throw new Error(
            "Couldn't rebuild this proposal's on-chain procedure exactly. Submitting " +
              'now would spend the pool on a different governance action than the one ' +
              'that was funded. Refresh the page and try again — if the issue persists, ' +
              "the SDK can't reconstruct this action variant and it needs to be fixed " +
              'before this proposal can be submitted.'
          )
        }
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

  const handlePropose = async () => {
    if (!walletObserver.api) {
      setError('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setTxHash(null)

    try {
      logger.debug('Starting proposal submission...')

      // Build the cosponsored proposal (validates the procedure against the
      // on-chain hash before we touch the chain). Warm the ancestor cache
      // ONLY for kinds that need it — a governance-state lookup failure must
      // never block InfoAction / TreasuryWithdrawal submission. The
      // existing-procedure path reuses the recovered action verbatim and
      // needs no cache.
      if (!proposal?.existingCosponsoredProposal) {
        await ensureAncestorsForKind(mapCategoryToActionKind(proposal?.categoryName || 'NicePoll'))
      }
      const cosponsoredProposal = buildCosponsoredProposal()

      // Ancestor-staleness guard: the ancestor was baked into the pool at
      // DEPOSIT time, but the ledger checks it against LIVE governance state
      // at submission — a mismatch (an enactment happened in between) burns
      // the entire pooled gov deposit. Refuse instead.
      const action = cosponsoredProposal.action as { kind: string } & Partial<{
        ancestor: GovernanceAction.IGovernanceActionId | null
      }>
      await assertAncestorCurrent(action.kind, action.ancestor, {
        koiosBaseUrl: koiosBaseUrl(),
      })

      requireConnectedWallet(walletObserver)
      const blaze = await createConfiguredBlaze(walletObserver)

      // browserPropose builds AND completes the transaction internally — it
      // selects the pooled cosponsor UTxOs, wires its own evaluator and
      // collateral, and returns a complete, CBOR-spliced `Core.Transaction`.
      // The modal therefore does NOT set an evaluator or collateral itself
      // (unlike the Sponsor/Withdraw preview paths which build the tx in-UI).
      logger.debug('Building propose transaction via browserPropose...')
      // The SDK returns a Transaction from its nested `@cardano-sdk/core` (0.45)
      // tree; the UI's `Core.Transaction` is pinned to 0.46.12. Structurally
      // identical at runtime — TS rejects only on the `#private` field identity
      // check. See TODO.md "Tech Debt: Blaze Override Stack".
      const completedTx = (await browserPropose({
        blaze,
        cosponsoredProposal,
        // Non-empty state trie (any deployment with >=1 prior propose) needs
        // chain queries to reconstruct the MPF — browsers have no env
        // fallback, so inject the config-driven Blockfrost backend.
        stateChainQueries: blockfrostStateChainQueries(
          config.blockfrostApiKey,
          `cardano-${config.blockfrostNetwork}`
        ),
      })) as unknown as Core.Transaction

      logger.debug('Propose transaction built, requesting signature from wallet...')

      // Exact-CBOR signing. `browserPropose` splices raw CBOR so the governance
      // procedure bytes are byte-exact and the transaction id is fixed. We MUST
      // sign the exact returned CBOR and preserve the body bytes on submit:
      // `signAndSubmitTransaction` calls `walletApi.signTx(completedTx.toCbor())`
      // (the exact spliced CBOR) and, on submit, reconstructs the tx reusing
      // `completedTx.body()` — whose `toCbor()` returns the cached original body
      // bytes (@cardano-sdk/core Serialization caches the bytes parsed by
      // `fromCbor`), so the tx id is preserved byte-for-byte. Only the witness
      // set is re-encoded, to add the wallet's vkey witnesses (which affects
      // neither the tx id nor the scriptDataHash). partialSign=true keeps the
      // SDK's script/redeemer witnesses intact — the wallet only adds vkeys.
      //
      // CAVEAT: some CIP-30 wallets re-serialize the transaction before signing.
      // Those wallets will change the spliced body bytes and break the tx id —
      // this flow requires a wallet that signs the CBOR exactly as provided.
      const { txHash: submittedTxHash } = await signAndSubmitTransaction({
        walletApi: walletObserver.api,
        completedTx,
        partialSign: true,
      })

      logger.debug(`Propose transaction submitted: ${submittedTxHash}`)
      logger.debug('View on explorer:', getExplorerTxUrl(submittedTxHash))

      // The script-address state just changed (the pool was spent into the
      // governance action) — drop cached chain state so the next load reflects
      // the submission instead of the pre-submit snapshot in the TTL window.
      invalidateChainPlanCache()
      clearProposalsCache()

      setTxHash(submittedTxHash)
      setIsProcessing(false)
    } catch (e) {
      console.error('Proposal submission failed:', e)

      const errMsg = e instanceof Error ? e.message : String(e)

      // Stale-UTxO family: the tx references a pooled input the evaluator can't
      // find on-chain (e.g. another submitter beat us, or the pool moved).
      if (
        errMsg.includes('missing from UTxO set') ||
        errMsg.includes('Unknown transaction input') ||
        errMsg.includes('MissingInputs') ||
        errMsg.includes('AdditionalUtxoOverlap') ||
        errMsg.includes('IncompleteUtxoSet')
      ) {
        setError(
          'A pooled UTxO is no longer available on-chain. This can happen if the ' +
            'proposal was already submitted, or your wallet state is stale. Please ' +
            'refresh the page and try again.'
        )
        setIsProcessing(false)
        return
      }

      // Script-rejection family: the cosponsor validator ran on-chain and
      // returned `error` — usually a procedure/identity mismatch.
      if (
        errMsg.includes('Ogmios v5 EvaluationFailure') &&
        (errMsg.includes('validatorFailed') || errMsg.includes('ScriptFailures'))
      ) {
        setError(
          'The cosponsor script rejected this submission. This usually means the ' +
            "procedure data doesn't exactly match the pooled proposal's on-chain " +
            `procedure. Try refreshing the page; if it persists, report it. (Raw: ${errMsg})`
        )
        setIsProcessing(false)
        return
      }

      setError(errMsg)
      setIsProcessing(false)
    }
  }

  const targetAda = proposal?.cosponsorTarget ?? 0
  const pooledAda = proposal?.pledgedAmount ?? 0

  const largestStringInList = useMemo(() => {
    return Math.max(
      formatNumber(targetAda, maxDecimalsAda).length,
      formatNumber(pooledAda, maxDecimalsAda).length
    )
  }, [formatNumber, targetAda, pooledAda])

  return (
    <Dialog
      onOpenChange={(open) => {
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
      >
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Submit this proposal on-chain
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            The pool has reached its target, so this governance action can now be submitted on-chain
            using the pooled ADA. You only pay the network fee plus collateral — the deposit comes
            from the pool and is refundable to the pool after enactment or expiry. You never take
            custody of the funds.
          </DialogDescription>
        </DialogHeader>
        <div className={'flex flex-col gap-4 px-4'}>
          <div className={'sun-text-16-md text-sun-header'}>Submission Details</div>
          <div className={'flex flex-col gap-4 md:gap-3'}>
            <LineOrderDetails
              label={`Deposit Target`}
              labelIcon={<Target />}
              currencyName={'ADA'}
              currencyIcon={
                <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
              }
              currencyValue={targetAda}
              classNameCurrency={'text-sun-default'}
              largestTextInList={largestStringInList}
            />
            <LineOrderDetails
              label={`Pooled So Far`}
              labelIcon={<Vote />}
              currencyName={'ADA'}
              currencyIcon={
                <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
              }
              currencyValue={pooledAda}
              largestTextInList={largestStringInList}
            />
            <LineOrderDetails
              label={`You Pay`}
              labelIcon={<Fuel />}
              labelTooltip={
                'You only cover the Cardano network fee and collateral for submitting the ' +
                'transaction. The gov_action_deposit is funded entirely from the pool.'
              }
              currencyName={'ADA'}
              currencyIcon={
                <IconCardano
                  className={'bg-sun-action-tertiary fill-sun-white-pure size-4 rounded-full'}
                />
              }
              currencyValue={0}
              classNameCurrency={'text-sun-default'}
              largestTextInList={largestStringInList}
            />
          </div>
        </div>

        {/* Exact-CBOR signing note */}
        <div className="text-sun-muted sun-text-12-rg flex items-start gap-2 px-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            This transaction must be signed exactly as built. Wallets that re-serialize transactions
            before signing are not compatible with on-chain submission.
          </span>
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
            <strong>Success!</strong> The governance action has been submitted on-chain.
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
            >
              {txHash ? 'Close' : 'Cancel'}
            </Button>
          </DialogClose>
          <Button
            size="lg"
            variant="default"
            className={'sun-text-14-rg h-12 grow'}
            onClick={handlePropose}
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
                Proposal Submitted
              </>
            ) : (
              <>
                <Send />
                Submit Proposal On-Chain
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
