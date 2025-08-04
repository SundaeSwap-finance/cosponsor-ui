import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import React, { ReactNode, useState } from 'react'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { Button } from '@/components/shadcn/button'
import { ArrowDownToLine, Download, Fuel, Signature, Vote } from 'lucide-react'
import { LineOrderDetails } from '@/components/modals/proposalAction/LineOrderDetails'
import { IconCardano } from '@/icons/IconCardano'
import { InputCurrencyLarge } from '@/components/input/InputCurrencyLarge'

export const ModalSponsor = ({ modalTrigger }: { modalTrigger: ReactNode }) => {
  //TODO: get this from wallet
  const tempADAAvailable = 12345678
  // TODO: get this from BE
  const tempFees = 12.34

  const [userPledging, setUserPledging] = useState<number>()
  const [userReceive, setUserReceive] = useState<number>()

  const onInputChanged = (value: number) => {
    console.log('onInputChanged', value)
    setUserPledging(value)
    setUserReceive(value)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{modalTrigger}</DialogTrigger>
      <DialogContentSundae className={'w-120 gap-6 rounded-3xl'} showCloseButton={false}>
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
            onChangeSanitized={onInputChanged}
            label="Amount to Pledge"
            placeholder={'0.0'}
            currencyLabel={'ADA'}
            currencyAvailable={tempADAAvailable}
            currencyIcon={
              <IconCardano
                className={'bg-sun-action-tertiary fill-sun-white-pure size-6.5 rounded-full'}
              />
            }
          />
          <div className={'flex flex-col gap-4 px-4'}>
            <div className={'sun-text-16-md text-sun-header'}>Order Details</div>
            <div className={'flex flex-col gap-4 md:gap-3'}>
              {/*TODO: calculate these values. Set defaults somewhere for now*/}
              <LineOrderDetails
                label={`You're Pledging`}
                labelIcon={<Vote />}
                currencyName={'ADA'}
                currencyIcon={
                  <IconCardano
                    className={'bg-sun-action-tertiary fill-sun-white-pure size-4 rounded-full'}
                  />
                }
                currencyValue={Number(userPledging)}
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
                currencyValue={Number(userReceive)}
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
