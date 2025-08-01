import { Input } from '@/components/shadcn/input'
import { InputDefault } from '@/components/input/InputDefault'
import { cn } from '@/lib/utils'
import React, { ReactNode, useState } from 'react'
import { IconCardano } from '@/icons/IconCardano'

interface CurrencyLargeInputProps extends React.ComponentProps<'input'> {
  label: string
  currencyLabel: string
  currencyIcon: ReactNode
  currencyAvailable: number
  onChangeSanitized: (value: number) => void
}

export const InputCurrencyLarge = ({
  label,
  currencyLabel,
  currencyIcon,
  currencyAvailable,
  onChangeSanitized,
  className,
  ...props
}: CurrencyLargeInputProps) => {
  const [value, setValue] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Using this combined with Input type of text so we do not have additional UI we would otherwise have with number input.
    const newValue = event.target.value
    if (/^[0-9]*\.?[0-9]*$/.test(newValue) && newValue.length < 20) {
      setValue(newValue)
      onChangeSanitized?.(Number(newValue))
    }
  }

  return (
    <div className={'relative flex w-full'}>
      <div
        className={
          'absolute top-4 left-4 flex flex-col gap-1 md:flex-row md:items-center md:gap-2.5'
        }
      >
        <div className={'sun-text-12-rg text-sun-muted'}>{label}</div>
        <div className={'text-sun-error sun-text-10-rg'}>*Required</div>
      </div>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        pattern="^[0-9]*\.?[0-9]*$"
        inputMode="numeric"
        className={cn(
          'border-sun-border-primary !bg-sun-white-pure sun-text-h3-sb text-sun-header rounded-md border',
          'h-25 pt-12 pr-40 pb-4 pl-4 md:pt-9',
          className
        )}
        {...props}
      />

      <div className={'absolute top-4 right-4 flex flex-row items-center gap-2.5'}>
        <div className={'sun-text-12-rg text-sun-muted'}>Avail. Balance:</div>
        <div
          className={
            'text-sun-action-tertiary sun-text-12-rg underlin-offset underline decoration-dotted decoration-1'
          }
        >
          {currencyAvailable}
        </div>
      </div>

      <div
        className={
          'border-sun-border-primary absolute right-4 bottom-4 flex w-25 items-center gap-2 rounded-full border py-1.5 pl-2'
        }
      >
        <div className={'flex size-6.5 items-center justify-center'}>{currencyIcon}</div>
        <div className={'sun-text-22-sb text-sun-header'}>{currencyLabel}</div>
      </div>
    </div>
  )
}
