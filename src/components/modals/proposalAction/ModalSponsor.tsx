import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import React, { ReactNode, useMemo, useRef, useState } from 'react'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { Button } from '@/components/shadcn/button'
import { ArrowDownToLine, Fuel, Signature, Vote } from 'lucide-react'
import { LineOrderDetails } from '@/components/modals/proposalAction/LineOrderDetails'
import { IconCardano } from '@/icons/IconCardano'
import { InputCurrencyLarge } from '@/components/input/InputCurrencyLarge'
import { useWalletObserver } from '@sundaeswap/wallet-lite'

export const ModalSponsor = ({ modalTrigger }: { modalTrigger: ReactNode }) => {
  const walletObserver = useWalletObserver()
  const amountInputRef = useRef<HTMLInputElement>(null)

  const [userPledging, setUserPledging] = useState<number>(0.0)
  const [userReceive, setUserReceive] = useState<number>(0.0)
  const [fees, setFees] = useState<number>(0.0)

  const onInputChanged = (value: number) => {
    //TODO if needed change calculation here
    setUserPledging(value)
    setUserReceive(value)
    // TODO: calc/get this from BE
    setFees(12.34)
  }

  const largestStringInList = useMemo(() => {
    return Math.max(
      userPledging?.toString().length ?? 0,
      userReceive?.toString().length ?? 0,
      fees.toString().length
    )
  }, [userPledging, userReceive, fees])

  return (
    <Dialog>
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
            currencyAvailable={walletObserver.adaBalance.amount}
            currencyIcon={
              <IconCardano className={'bg-sun-ada fill-sun-white-pure size-6.5 rounded-full'} />
            }
          />
          <div className={'flex flex-col gap-4 px-4'}>
            <div className={'sun-text-16-md text-sun-header'}>Order Details</div>
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
                labelIcon={<Fuel />}
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
        <DialogFooter className={'border-sun-border-primary border-t pt-6'}>
          <DialogClose asChild>
            <Button size="lg" variant="secondary" className={'sun-text-14-rg h-12 grow'}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="lg" variant="default" className={'sun-text-14-rg h-12 grow'}>
            <Signature />
            Confirm Pledge Amount & Sign
          </Button>
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
