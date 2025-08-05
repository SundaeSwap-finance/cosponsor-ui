import { Input } from '@/components/shadcn/input'
import { cn } from '@/lib/utils'
import React, { ReactNode, useMemo, useState } from 'react'
import { useNumberFormatter } from '@/composables/useNumberFormatter'

interface CurrencyLargeInputProps extends React.ComponentProps<'input'> {
  label: string
  currencyLabel: string
  currencyIcon: ReactNode
  // Currency available in base units (lovelace)
  currencyAvailable: bigint
  onChangeSanitized: (value: number) => void
}

export const InputCurrencyLarge = ({
  label,
  currencyLabel,
  currencyIcon,
  currencyAvailable,
  onChangeSanitized,
  className,
  // Default value is in ADA not in lovelace
  defaultValue,
  ...props
}: CurrencyLargeInputProps) => {
  const { formatLovelaceToAdaNumber } = useNumberFormatter()

  const [value, setValue] = useState(defaultValue ? defaultValue : 0.0)
  const [warning, setWarning] = useState('* Required')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Using this combined with Input type of text so we do not have additional UI or limits we would otherwise have with number input.
    const newValue: string = event.target.value
    setWarning('')
    if (/^[0-9]*\.?[0-9]*$/.test(newValue)) {
      if (Number(newValue) <= currencyToNumber()) {
        setWarning('')
        onChangeSanitized?.(Number(newValue))
        setValue(newValue)
        return
      }
      setValue(newValue)
      setWarning('Value exceeds available ' + currencyLabel)
    }
  }

  const currencyToNumber = () => {
    const currencyLowercase = currencyLabel.toLowerCase()
    if (currencyLowercase === 'ada' || currencyLowercase === 'gada') {
      return formatLovelaceToAdaNumber(currencyAvailable)
    } else {
      return Number(currencyAvailable)
    }
  }
  const warningBorder = useMemo(() => {
    return warning.length > 0 && !warning.includes('Required')
  }, [warning])

  return (
    <div className={'relative flex w-full'}>
      <div
        className={
          'absolute top-4 left-4 flex flex-col gap-1 md:flex-row md:items-center md:gap-2.5'
        }
      >
        <label htmlFor="largeCurrencyInput" className={'sun-text-12-rg text-sun-muted'}>
          {label}
        </label>
        <div className={'text-sun-error sun-text-10-rg'}>{warning}</div>
      </div>
      <Input
        id="largeCurrencyInput"
        aria-errormessage={warning}
        type="text"
        value={value}
        onChange={handleChange}
        pattern="^[0-9]*\.?[0-9]*$"
        inputMode="numeric"
        className={cn(
          '!bg-sun-white-pure sun-text-h3-sb text-sun-header rounded-md border !ring-1',
          'h-25 pt-12 pr-40 pb-4 pl-4 md:pt-9',
          warningBorder ? '!ring-sun-error' : 'ring-sun-border-primary',
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
          {currencyToNumber()}
        </div>
      </div>

      <div
        className={
          'border-sun-border-primary absolute top-auto right-4 bottom-4 flex w-fit items-center gap-2 rounded-full border py-1.5 pr-4 pl-2'
        }
      >
        <div className={'flex size-6.5 w-full items-center justify-center'}>{currencyIcon}</div>
        <div className={'sun-text-22-sb text-sun-header flex w-full'}>{currencyLabel}</div>
      </div>
    </div>
  )
}
