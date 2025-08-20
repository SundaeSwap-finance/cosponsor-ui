import { InputDatePicker } from '@/components/input/InputDatePicker'
import { Button } from '@/components/shadcn/button'
import { useMemo, useState } from 'react'

export const FilterPropExpiration = ({
  applyFilter,
}: {
  applyFilter?: (dates: (Date | undefined)[]) => void
}) => {
  const defaultValues: (Date | undefined)[] = [undefined, undefined]
  const [inputValues, setInputValues] = useState<(Date | undefined)[]>(defaultValues)

  const onDateSelect = (index: number, date: Date | undefined) => {
    const newFilters = {
      ...inputValues,
      [index]: date,
    }
    setInputValues(newFilters)
    applyFilter?.(newFilters)
  }
  const startDate = useMemo(() => inputValues[0], [inputValues])
  const endDate = useMemo(() => inputValues[1], [inputValues])

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full justify-start'}>Expiration Date</div>
      <div className={'flex flex-col gap-4'}>
        <div className={'sun-text-12-rg'}>
          Get proposals with their expiration date between these values.
        </div>
        <InputDatePicker
          label={'Start'}
          className={'w-full'}
          onSelect={(value) => onDateSelect(0, value)}
          selectedDate={startDate}
        />
        <InputDatePicker
          label={'End'}
          className={'w-full'}
          onSelect={(value) => onDateSelect(1, value)}
          selectedDate={endDate}
        />
        <Button
          onClick={() => {
            console.log('reset')
            setInputValues([])
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
