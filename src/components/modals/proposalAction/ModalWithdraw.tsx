import React, { ReactNode, useMemo, useRef, useState } from 'react'
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
import { ArrowDownToLine, Fuel, Signature, Vote } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { iProposalCardData } from '@/types/Proposal'
import { useNumberFormatter } from '@/composables/useNumberFormatter'

export const ModalWithdraw = ({
  modalTrigger,
  proposal,
}: {
  modalTrigger: ReactNode
  proposal: iProposalCardData
}) => {
  const { formatLovelaceToAdaString } = useNumberFormatter()
  // TODO: get this from BE, and calculate
  const tempFees = 12.34
  const amountInputRef = useRef<HTMLInputElement>(null)

  const lovelaceToRetrieve: bigint = BigInt(proposal.userPledged * 10 ** 6)
  const [userDepositGAda, setUserDepositGAda] = useState<number>(proposal.userPledged)
  const [userReceive, setUserReceive] = useState<number>(proposal.userPledged)

  const onInputChanged = (value: number) => {
    //TODO if needed change calculation here
    setUserDepositGAda(value)
    setUserReceive(value)
  }

  const largestStringInList = useMemo(() => {
    return Math.max(
      userDepositGAda?.toString().length ?? 0,
      userReceive?.toString().length ?? 0,
      tempFees.toString().length
    )
  }, [userDepositGAda, userReceive, tempFees])

  return (
    <Dialog>
      <DialogTrigger asChild>{modalTrigger}</DialogTrigger>
      <DialogContentSundae
        className={'w-120 gap-6 rounded-3xl'}
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // Prevent default radix behaviour (to prevent .select)
          event.preventDefault()
          amountInputRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Withdraw Your Pledge
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            Deposit your <b>gADA</b> to redeem your{' '}
            <b>{formatLovelaceToAdaString(lovelaceToRetrieve)} ADA.</b>
          </DialogDescription>
        </DialogHeader>
        <div className={'flex flex-col gap-6'}>
          <InputCurrencyLarge
            ref={amountInputRef}
            onChangeSanitized={onInputChanged}
            label="gADA to Deposit"
            placeholder={'0.0'}
            currencyLabel={'gADA'}
            currencyAvailable={lovelaceToRetrieve}
            defaultValue={proposal.userPledged}
            currencyIcon={
              <IconCardano className={'bg-sun-gada fill-sun-white-pure size-6.5 rounded-full'} />
            }
          />
          <div className={'flex flex-col gap-4 px-4'}>
            <div className={'sun-text-16-md text-sun-header'}>Order Details</div>
            <div className={'flex flex-col gap-4 md:gap-3'}>
              <LineOrderDetails
                label={`You're Depositing`}
                labelIcon={<Vote />}
                currencyName={'gADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-gada fill-sun-white-pure size-4 rounded-full'} />
                }
                currencyValue={Number(userDepositGAda)}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`You'll receive`}
                labelIcon={<ArrowDownToLine />}
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano className={'bg-sun-ada fill-sun-white-pure size-4 rounded-full'} />
                }
                currencyValue={Number(userReceive)}
                largestTextInList={largestStringInList}
              />
              <LineOrderDetails
                label={`Total Fees`}
                labelIcon={<Fuel />}
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano
                    className={'bg-sun-action-tertiary fill-sun-white-pure size-4 rounded-full'}
                  />
                }
                currencyValue={tempFees}
                classNameCurrency={'text-sun-default'}
                largestTextInList={largestStringInList}
              />
            </div>
          </div>
        </div>
        <DialogFooter className={'border-sun-border-primary border-t pt-6'}>
          <DialogClose asChild>
            <Button size="lg" variant="secondary" className={'sun-text-14-rg h-12 grow'}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="lg" variant="default" className={'sun-text-14-rg h-12 grow'}>
            <Signature />
            Confirm Redemption Amount & Sign
          </Button>
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
