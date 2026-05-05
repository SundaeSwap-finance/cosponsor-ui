import { InputDatePicker } from '@/components/input/InputDatePicker'
import { Button } from '@/components/shadcn/button'
import { useState } from 'react'
import { X } from 'lucide-react'

export const FilterPropExpiration = ({
  applyFilter,
}: {
  applyFilter?: (dates: (Date | undefined)[]) => void
}) => {
  const defaultValues: (Date | undefined)[] = [undefined, undefined]
  const [dateRange, setDateRange] = useState<(Date | undefined)[]>(defaultValues)

  const onDateSelect = (index: number, date: Date | undefined) => {
    const newFilters = {
      ...dateRange,
      [index]: date,
    }
    setDateRange(newFilters)
    applyFilter?.(newFilters)
  }

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'flex flex-col gap-2'}>
        <div className={'sun-text-12-rg'}>
          Get proposals with their expiration date between these values.
        </div>
        <div className={'flex flex-row items-center justify-start gap-2'}>
          <InputDatePicker
            label={'Start'}
            onSelect={(value) => onDateSelect(0, value)}
            selectedDate={dateRange[0]}
            hiddenAfter={dateRange[1]}
          />
          {dateRange[0] && (
            <Button
              aria-label={'Reset start date filter'}
              size={'icon'}
              className={'size-6'}
              onClick={() => {
                onDateSelect(0, undefined)
              }}
            >
              <X />
            </Button>
          )}
        </div>
        <div className={'flex flex-row items-center justify-start gap-2'}>
          <InputDatePicker
            label={'End'}
            onSelect={(value) => onDateSelect(1, value)}
            selectedDate={dateRange[1]}
            hiddenBefore={dateRange[0]}
          />
          {dateRange[1] && (
            <Button
              aria-label={'Reset end date filter'}
              size={'icon'}
              className={'size-6'}
              onClick={() => {
                onDateSelect(1, undefined)
              }}
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      <Button
        aria-label={'Reset all date filters'}
        className={'w-fit'}
        size={'sm'}
        onClick={() => {
          setDateRange(defaultValues)
          applyFilter?.(defaultValues)
        }}
      >
        Reset
      </Button>
    </div>
  )
}
