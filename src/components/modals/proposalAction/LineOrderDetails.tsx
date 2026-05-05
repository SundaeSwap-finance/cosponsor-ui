import { ReactNode } from 'react'
import { maxDecimalsAda } from '@/config/config'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/tooltip'

export const LineOrderDetails = ({
  label,
  labelIcon,
  labelTooltip,
  currencyName,
  currencyIcon,
  currencyValue,
  classNameCurrency,
  largestTextInList,
}: {
  label: string
  labelIcon: ReactNode
  labelTooltip?: string
  currencyName: string
  currencyIcon: ReactNode
  currencyValue: number
  classNameCurrency?: string
  largestTextInList?: number
}) => {
  const { formatNumber } = useNumberFormatter()

  const labelContent = (
    <div className={'underline decoration-dotted decoration-1 underline-offset-4'}>{label}</div>
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between',
        (largestTextInList ?? 0) > 15 ? 'md:flex-col md:items-start' : ''
      )}
    >
      <div className={'sun-text-16-rg text-sun-default flex flex-row gap-4'}>
        <div className={'flex w-4 items-center object-contain'}>{labelIcon}</div>
        {labelTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>{labelContent}</TooltipTrigger>
            <TooltipContent className={'max-w-64'}>{labelTooltip}</TooltipContent>
          </Tooltip>
        ) : (
          labelContent
        )}
      </div>
      <div className={cn('text-sun-header flex flex-row items-center gap-2', classNameCurrency)}>
        <div className={'flex size-4 items-center justify-center'}>{currencyIcon}</div>
        <div className={'sun-text-16-md flex overflow-x-auto'}>
          {formatNumber(currencyValue, maxDecimalsAda)} {currencyName}
        </div>
      </div>
    </div>
  )
}
