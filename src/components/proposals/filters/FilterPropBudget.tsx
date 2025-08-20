import { Slider } from '../../shadcn/slider'
import { useState } from 'react'

export const FilterPropBudget = ({ applyFilter }: { applyFilter?: (value: number[]) => void }) => {
  const defaultValues = [0, 100000]
  const [inputValues, setInputValues] = useState<number[]>(defaultValues)

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full justify-start'}>Requested budget</div>
      <div className={'flex flex-col gap-2'}>
        <Slider
          className={'[&_[data-slot=slider-range]]:bg-sun-highlight-primary/20'}
          defaultValue={defaultValues}
          onValueChange={setInputValues}
          onValueCommit={(value) => applyFilter?.(value)}
          min={0}
          max={100000}
        />
        <div className={'flex w-full flex-row items-center justify-between px-1'}>
          <div>{inputValues[0]}</div>
          <div>{inputValues[1]}</div>
        </div>
      </div>
    </div>
  )
}
