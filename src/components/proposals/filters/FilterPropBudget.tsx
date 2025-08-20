import { Slider } from '../../shadcn/slider'
import { useState } from 'react'
import { Button } from '@/components/shadcn/button'

export const FilterPropBudget = ({ applyFilter }: { applyFilter?: (value: number[]) => void }) => {
  const defaultValues = [0, 100000]
  const [inputValues, setInputValues] = useState<number[]>(defaultValues)

  return (
    <div className={'flex flex-col gap-8 pt-2'}>
      <div className={'flex flex-col gap-2'}>
        <Slider
          className={'[&_[data-slot=slider-range]]:bg-sun-highlight-primary/20'}
          value={inputValues}
          defaultValue={defaultValues}
          onValueChange={setInputValues}
          onValueCommit={(value) => applyFilter?.(value)}
          min={defaultValues[0]}
          max={defaultValues[1]}
        />
        <div className={'flex w-full flex-row items-center justify-between px-1'}>
          <div>₳{inputValues[0]}</div>
          <div>₳{inputValues[1]}</div>
        </div>
      </div>
      <Button
        className={'w-fit'}
        size={'sm'}
        onClick={() => {
          setInputValues(defaultValues)
          applyFilter?.(defaultValues)
        }}
      >
        Reset
      </Button>
    </div>
  )
}
