import { Vote } from 'lucide-react'
import { ReactNode } from 'react'
import { maxDecimalsAda } from '@/config/config'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { cn } from '@/lib/utils'

export const LineOrderDetails = ({
  label,
  labelIcon,
  currencyName,
  currencyIcon,
  currencyValue,
  classNameCurrency,
}: {
  label: string
  labelIcon: ReactNode
  currencyName: string
  currencyIcon: ReactNode
  currencyValue: number
  classNameCurrency?: string
}) => {
  const { formatNumber } = useNumberFormatter()

  return (
    <div className={'flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between'}>
      <div className={'sun-text-16-rg text-sun-default flex flex-row gap-4'}>
        <div className={'flex w-4 items-center object-contain'}>{labelIcon}</div>
        <div className={'underline decoration-dotted decoration-1 underline-offset-4'}>{label}</div>
      </div>
      <div className={cn('text-sun-header flex flex-row items-center gap-2', classNameCurrency)}>
        <div className={'flex size-4 items-center justify-center'}>{currencyIcon}</div>
        <div className={'sun-text-16-md'}>
          {formatNumber(currencyValue, maxDecimalsAda)} {currencyName}
        </div>
      </div>
    </div>
  )
}
