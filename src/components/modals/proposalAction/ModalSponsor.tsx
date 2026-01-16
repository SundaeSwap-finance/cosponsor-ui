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
  parseAddressToCredential,
  pendingUtxoTracker,
  extractTransactionEffects,
} from '@sundaeswap/cosponsor-sdk/browser'
import { ICosponsoredProposal, GovernanceAction } from '@sundaeswap/cosponsor-sdk/validators'
import { Core } from '@blaze-cardano/sdk'
import { IProposalCardData } from '@/types/Proposal'

// URLs from environment variables
const OGMIOS_URL = import.meta.env.COSPONSOR_OGMIOS_URL as string
const BLOCKFROST_API = import.meta.env.COSPONSOR_BLOCKFROST_API_URL as string

// Verify if a specific UTxO exists on-chain via Blockfrost
// Kept for debugging stale UTxO issues - see commented block in handleSponsor
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verifyUtxoOnChain(
  txHash: string,
  outputIndex: number
): Promise<{ exists: boolean; error?: string }> {
  const apiKey = import.meta.env.COSPONSOR_BLOCKFROST_API_KEY
  if (!apiKey) {
    return { exists: false, error: 'No Blockfrost API key' }
  }

  try {
    const response = await fetch(`${BLOCKFROST_API}/txs/${txHash}/utxos`, {
      headers: { project_id: apiKey },
    })

    if (response.status === 404) {
      return { exists: false, error: 'Transaction not found' }
    }

    if (!response.ok) {
      return { exists: false, error: `Blockfrost error: ${response.status}` }
    }

    const data = await response.json()
    // Check if the specific output exists and is unspent
    const output = data.outputs?.find(
      (o: { output_index: number; consumed_by_tx?: string }) => o.output_index === outputIndex
    )

    if (!output) {
      return { exists: false, error: `Output #${outputIndex} not found in tx` }
    }

    if (output.consumed_by_tx) {
      return {
        exists: false,
        error: `UTxO already spent by: ${output.consumed_by_tx}`,
      }
    }

    return { exists: true }
  } catch (err) {
    return { exists: false, error: String(err) }
  }
}

// Browser-compatible Ogmios evaluation for debugging
async function evaluateWithOgmios(txCbor: string): Promise<string> {
  // eslint-disable-next-line no-console
  console.log('evaluateWithOgmios: connecting to', OGMIOS_URL)
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(OGMIOS_URL)
    const timeout = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('evaluateWithOgmios: timeout')
      ws.close()
      reject(new Error('Ogmios WebSocket timeout'))
    }, 15000)

    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('evaluateWithOgmios: connected, sending request')
      const request = {
        jsonrpc: '2.0',
        method: 'evaluateTransaction',
        params: { transaction: { cbor: txCbor } },
        id: `eval-${Date.now()}`,
      }
      ws.send(JSON.stringify(request))
    }

    ws.onmessage = (event) => {
      clearTimeout(timeout)
      // eslint-disable-next-line no-console
      console.log('evaluateWithOgmios: received message', event.data)
      ws.close()
      try {
        const response = JSON.parse(event.data)
        if (response.error) {
          reject(new Error(`Ogmios: ${JSON.stringify(response.error, null, 2)}`))
        } else {
          resolve(JSON.stringify(response.result, null, 2))
        }
      } catch (e) {
        reject(e)
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      // eslint-disable-next-line no-console
      console.log('evaluateWithOgmios: error', err)
      reject(new Error(`Ogmios WebSocket error: ${err}`))
    }
  })
}

export interface IModalSponsorProps {
  modalTrigger: ReactNode
  /** The proposal to sponsor. If not provided, uses test data. */
  proposal?: IProposalCardData
}

// Map UI category names to valid Aiken governance action kinds
const CATEGORY_TO_ACTION_KIND: Record<string, string> = {
  'Info Action': 'NicePoll',
  'Treasury Withdrawal': 'TreasuryWithdrawal',
  TreasuryWithdrawals: 'TreasuryWithdrawal',
  'Treasury requests': 'TreasuryWithdrawal',
  'Protocol Parameters': 'ProtocolParameters',
  'Hard Fork': 'HardFork',
  'No Confidence': 'NoConfidence',
  'Constitutional Committee': 'ConstitutionalCommittee',
  'New Constitution': 'NewConstitution',
  'Updates to the Constitution': 'NewConstitution',
  NicePoll: 'NicePoll',
}

// All 7 governance action types are now supported for cosponsoring
const SUPPORTED_ACTION_TYPES = [
  'ProtocolParameters', // Constructor 0: Protocol Parameters Update
  'HardFork', // Constructor 1: Hard Fork Initiation
  'TreasuryWithdrawal', // Constructor 2: Treasury Withdrawal
  'NoConfidence', // Constructor 3: No Confidence Motion
  'ConstitutionalCommittee', // Constructor 4: Constitutional Committee Update
  'NewConstitution', // Constructor 5: New Constitution
  'NicePoll', // Constructor 6: Info Action
]

// User-friendly names for governance action types
const ACTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  NicePoll: 'Info Action',
  TreasuryWithdrawal: 'Treasury Withdrawal',
  ProtocolParameters: 'Protocol Parameters',
  HardFork: 'Hard Fork',
  NoConfidence: 'No Confidence',
  NewConstitution: 'New Constitution',
  ConstitutionalCommittee: 'Constitutional Committee',
}

// Map category name to action kind
const mapCategoryToActionKind = (category: string): string => {
  const actionKind = CATEGORY_TO_ACTION_KIND[category]
  if (!actionKind) {
    throw new Error(
      `Unknown governance action category: "${category}". ` +
        `Valid categories: ${Object.keys(CATEGORY_TO_ACTION_KIND).join(', ')}`
    )
  }
  return actionKind
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

  // Build governance action with proper data for the action type
  const buildGovernanceAction = (actionKind: string): GovernanceAction.TGovernanceAction => {
    // Check if action type is supported
    if (!SUPPORTED_ACTION_TYPES.includes(actionKind)) {
      const displayName = ACTION_TYPE_DISPLAY_NAMES[actionKind] || actionKind
      throw new Error(`Unknown governance action type: "${displayName}". Please report this issue.`)
    }

    switch (actionKind) {
      case 'ProtocolParameters': {
        // Constructor 0: Protocol Parameters Update
        // For testing: uses empty parameters (no changes proposed)
        return {
          kind: 'ProtocolParameters',
          ancestor: null,
        } as GovernanceAction.IProtocolParameters
      }

      case 'HardFork': {
        // Constructor 1: Hard Fork Initiation
        // Requires version from proposal.hardForkVersion
        if (!proposal?.hardForkVersion) {
          throw new Error(
            'Hard Fork proposals require version data. ' +
              'No version information found for this proposal.'
          )
        }

        return {
          kind: 'HardFork',
          ancestor: null, // No ancestor for new proposals
          version: {
            major: proposal.hardForkVersion.major,
            minor: proposal.hardForkVersion.minor,
          },
        } as GovernanceAction.IHardFork
      }

      case 'TreasuryWithdrawal': {
        // Constructor 2: Treasury Withdrawal
        // Requires beneficiaries from proposal.withdrawals
        if (!proposal?.withdrawals || proposal.withdrawals.length === 0) {
          throw new Error(
            'Treasury Withdrawal proposals require beneficiary data. ' +
              'No withdrawal beneficiaries found for this proposal.'
          )
        }

        // Build beneficiaries map from proposal withdrawals
        const beneficiaries = new Map<{ vkey: string } | { script: string }, bigint>()
        for (const withdrawal of proposal.withdrawals) {
          try {
            const credential = parseAddressToCredential(withdrawal.receivingAddress)
            beneficiaries.set(credential, BigInt(withdrawal.amount))
          } catch (error) {
            throw new Error(
              `Failed to parse beneficiary address: ${withdrawal.receivingAddress}. ` +
                `${error instanceof Error ? error.message : String(error)}`
            )
          }
        }

        return {
          kind: 'TreasuryWithdrawal',
          beneficiaries,
          // guardRails is undefined = Option::None (don't set it)
        } as GovernanceAction.ITreasuryWithdrawal
      }

      case 'NoConfidence': {
        // Constructor 3: No Confidence Motion
        // Just needs ancestor (null for new proposals)
        return {
          kind: 'NoConfidence',
          ancestor: null,
        } as GovernanceAction.INoConfidence
      }

      case 'ConstitutionalCommittee': {
        // Constructor 4: Constitutional Committee Update
        // For testing: empty member changes with 2/3 quorum
        return {
          kind: 'ConstitutionalCommittee',
          ancestor: null,
          membersToRemove: [], // No members to remove
          membersToAdd: new Map(), // No members to add
          quorum: { numerator: 2n, denominator: 3n }, // 2/3 majority
        } as GovernanceAction.IConstitutionalCommittee
      }

      case 'NewConstitution': {
        // Constructor 5: New Constitution
        // Requires constitution hash and URL from proposal
        if (!proposal?.constitutionHash || !proposal?.constitutionUrl) {
          throw new Error(
            'New Constitution proposals require constitution data. ' +
              'No constitution hash or URL found for this proposal.'
          )
        }

        return {
          kind: 'NewConstitution',
          ancestor: null, // No ancestor for new proposals
          constitutionHash: proposal.constitutionHash,
          constitutionUrl: proposal.constitutionUrl,
        } as GovernanceAction.INewConstitution
      }

      case 'NicePoll': {
        // Constructor 6: Info Action (simplest - no data needed)
        return { kind: 'NicePoll' } as GovernanceAction.INicePoll
      }

      default: {
        throw new Error(`Unhandled governance action kind: ${actionKind}`)
      }
    }
  }

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
        action: buildGovernanceAction(actionKind),
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
        // eslint-disable-next-line no-console
        console.log(`📊 Building transaction preview for ${userPledging} ADA to calculate fees...`)

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

        // eslint-disable-next-line no-console
        console.log(`💰 Transaction fees: ${feeAda} ADA`)
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

      // NOTE: On-chain UTxO verification disabled - wallet should be trusted
      // Re-enable this block if debugging stale UTxO issues by uncommenting below
      // See verifyUtxoOnChain() function for the verification logic
      /*
      const utxosHex = await walletObserver.api.getUtxos()
      if (utxosHex && utxosHex.length > 0) {
        for (let i = 0; i < utxosHex.length; i++) {
          const utxo = Core.TransactionUnspentOutput.fromCbor(utxosHex[i] as Core.HexBlob)
          const txId = utxo.input().transactionId()
          const outputIndex = Number(utxo.input().index())
          const verification = await verifyUtxoOnChain(txId, outputIndex)
          console.log(`${txId}#${outputIndex}`, verification.exists ? '✅' : `❌ ${verification.error}`)
        }
      }
      */

      // Always build a fresh transaction when clicking Pledge
      // Never use preview transaction - it may have stale UTxOs from a previous action
      // eslint-disable-next-line no-console
      console.log('🔨 Building fresh transaction (ignoring any preview)...')

      // Create the cosponsored proposal with user's pledge amount
      const cosponsoredProposal = buildCosponsoredProposal(depositAmount)

      // eslint-disable-next-line no-console
      console.log('Building transaction for deposit:', {
        depositAmount: depositAmount.toString(),
        depositADA: userPledging,
        proposalId: proposal?.id || 'test',
        proposal: cosponsoredProposal,
      })

      // Create Blaze instance with browser wallet
      // eslint-disable-next-line no-console
      console.log('Creating Blaze instance with browser wallet...')
      const blaze = await createBlazeWithBrowserWallet(walletObserver)

      // Build the deposit transaction using browser-compatible function
      // eslint-disable-next-line no-console
      console.log('Building deposit transaction...')
      let txBuilder = await browserDeposit({ blaze, cosponsoredProposal, depositAmount })

      // Use Ogmios evaluator instead of Blockfrost - Ogmios has mempool access
      // This allows evaluating transactions that spend UTxOs from pending (unconfirmed) transactions
      const ogmiosEvaluator = createOgmiosEvaluator(OGMIOS_URL)
      txBuilder = txBuilder.useEvaluator(ogmiosEvaluator)

      // Complete the transaction - Ogmios handles evaluation
      // eslint-disable-next-line no-console
      console.log('Completing transaction with Ogmios evaluation...')
      let completedTx: Core.Transaction | null = null
      try {
        completedTx = await txBuilder.complete()
        // eslint-disable-next-line no-console
        console.log('✅ Transaction completed successfully!')
      } catch (blockfrostError) {
        // Log the actual Blockfrost error
        // eslint-disable-next-line no-console
        console.log('⚠️ Blockfrost evaluation failed:')
        console.error('Blockfrost error details:', blockfrostError)
        if (blockfrostError instanceof Error) {
          // eslint-disable-next-line no-console
          console.log('Error message:', blockfrostError.message)
          // eslint-disable-next-line no-console
          console.log('Error stack:', blockfrostError.stack)
        }
        // Try Ogmios for detailed error message
        // eslint-disable-next-line no-console
        console.log('Trying Ogmios for detailed error...')
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builder = txBuilder as any
          const txBody = builder.body

          const witnessSet = new Core.TransactionWitnessSet()
          if (builder.redeemers) {
            witnessSet.setRedeemers(builder.redeemers)
          }
          // Note: plutusData handling skipped - not needed for Ogmios evaluation
          const incompleteTx = new Core.Transaction(txBody, witnessSet, builder.auxiliaryData)
          const txCbor = incompleteTx.toCbor()
          const ogmiosResult = await evaluateWithOgmios(txCbor)
          // eslint-disable-next-line no-console
          console.log('Ogmios evaluation result:', ogmiosResult)
        } catch (ogmiosError) {
          console.error('Ogmios error:', ogmiosError)
        }

        throw blockfrostError
      }

      // Ensure we have a completed transaction
      if (!completedTx) {
        throw new Error('Failed to build transaction')
      }

      // Log the transaction details
      const txCbor = completedTx.toCbor()
      // eslint-disable-next-line no-console
      console.log('Built transaction:', {
        type: 'deposit',
        depositAmount: depositAmount.toString(),
        depositADA: userPledging,
        txSize: txCbor.length / 2, // CBOR hex length / 2 = bytes
        fees: fees,
      })

      // Prompt wallet to sign the transaction
      // eslint-disable-next-line no-console
      console.log('Requesting wallet signature...')
      const witnessSetHex = await walletObserver.api.signTx(txCbor, false)

      // eslint-disable-next-line no-console
      console.log('Transaction signed successfully!')
      // eslint-disable-next-line no-console
      console.log('Wallet witness set CBOR:', witnessSetHex)

      // Combine the transaction's witness set (redeemers) with wallet's witness set (signatures)
      // eslint-disable-next-line no-console
      console.log('Combining transaction with wallet signatures...')

      // Get the transaction's existing witness set (has redeemers)
      const txWitnessSet = completedTx.witnessSet()
      // eslint-disable-next-line no-console
      console.log('Transaction witness set (with redeemers):', txWitnessSet)

      // Parse wallet's witness set (has vkey witnesses/signatures)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletWitnessSet = Core.TransactionWitnessSet.fromCbor(witnessSetHex as any)
      // eslint-disable-next-line no-console
      console.log('Wallet witness set (with signatures):', walletWitnessSet)

      // Get vkey witnesses from wallet
      const vkeyWitnesses = walletWitnessSet.vkeys()
      // eslint-disable-next-line no-console
      console.log('Wallet vkey witnesses:', vkeyWitnesses)

      // Add wallet's vkey witnesses to transaction's witness set
      if (vkeyWitnesses && vkeyWitnesses.size() > 0) {
        // eslint-disable-next-line no-console
        console.log('Adding', vkeyWitnesses.size(), 'vkey witness(es) to transaction')
        txWitnessSet.setVkeys(vkeyWitnesses)
      }

      // Create the signed transaction with combined witness set and auxiliary data (metadata)
      // Include the auxiliary data from the original transaction which contains the CIP-25 metadata
      const auxiliaryData = completedTx.auxiliaryData()
      const signedTx = new Core.Transaction(completedTx.body(), txWitnessSet, auxiliaryData)

      // Get the signed transaction CBOR
      const signedTxCbor = signedTx.toCbor()
      // eslint-disable-next-line no-console
      console.log('Combined signed transaction CBOR length:', signedTxCbor.length)

      // Submit the transaction to the blockchain
      // eslint-disable-next-line no-console
      console.log('Submitting transaction to blockchain...')

      try {
        // Use wallet's submitTx method to submit the signed transaction
        const submittedTxHash = await walletObserver.api.submitTx(signedTxCbor)

        // eslint-disable-next-line no-console
        console.log('✅ Transaction submitted successfully!')
        // eslint-disable-next-line no-console
        console.log('Transaction hash:', submittedTxHash)
        // eslint-disable-next-line no-console
        console.log(
          'View on explorer:',
          `https://preview.cardanoscan.io/transaction/${submittedTxHash}`
        )

        // Track the transaction effects for tx chaining
        // This allows subsequent transactions to know which UTxOs were spent/created
        if (completedTx) {
          const { spentInputs, createdOutputs } = extractTransactionEffects(
            completedTx,
            submittedTxHash
          )
          pendingUtxoTracker.recordTransaction(submittedTxHash, spentInputs, createdOutputs)
        }

        setTxHash(submittedTxHash)
        setIsProcessing(false)
      } catch (submitError) {
        console.error('Failed to submit transaction:', submitError)
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
              href={`https://preview.cardanoscan.io/transaction/${txHash}`}
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
