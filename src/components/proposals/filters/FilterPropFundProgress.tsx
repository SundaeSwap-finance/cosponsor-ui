import { useState } from 'react'
import { Slider } from '@/components/shadcn/slider'

export const FilterPropFundProgress = ({
  applyFilter,
}: {
  applyFilter?: (value: number[]) => void
}) => {
  const defaultValues = [0, 100]
  const [inputValues, setInputValues] = useState<number[]>(defaultValues)

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full justify-start'}>Funding progress</div>
      <div className={'flex flex-col gap-2'}>
        <Slider
          className={'[&_[data-slot=slider-range]]:bg-sun-highlight-primary/20'}
          defaultValue={defaultValues}
          onValueChange={setInputValues}
          onValueCommit={(value) => applyFilter?.(value)}
          min={defaultValues[0]}
          max={defaultValues[1]}
        />
        <div className={'flex w-full flex-row items-center justify-between px-1'}>
          <div>{inputValues[0]}%</div>
          <div>{inputValues[1]}%</div>
        </div>
      </div>
    </div>
  )
}
