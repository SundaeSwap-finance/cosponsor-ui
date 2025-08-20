import { useState } from 'react'
import { Slider } from '@/components/shadcn/slider'
import { Button } from '@/components/shadcn/button'

export const FilterPropFundProgress = ({
  applyFilter,
}: {
  applyFilter?: (value: number[]) => void
}) => {
  const defaultValues = [0, 100]
  const [inputValues, setInputValues] = useState<number[]>(defaultValues)

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'flex flex-col gap-2 pt-2'}>
        <Slider
          className={'[&_[data-slot=slider-range]]:bg-sun-highlight-primary/20'}
          defaultValue={defaultValues}
          onValueChange={setInputValues}
          onValueCommit={(value) => applyFilter?.(value)}
          value={inputValues}
          min={defaultValues[0]}
          max={defaultValues[1]}
        />
        <div className={'flex w-full flex-row items-center justify-between px-1'}>
          <div>{inputValues[0]}%</div>
          <div>{inputValues[1]}%</div>
        </div>
      </div>
      <Button
        size={'sm'}
        className={'w-fit'}
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
