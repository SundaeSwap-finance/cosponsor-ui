import { useState } from 'react'
import { Toggle } from '@/components/shadcn/toggle'
import { Button } from '@/components/shadcn/button'

export const FilterPropStatus = ({ applyFilter }: { applyFilter?: (filter: string[]) => void }) => {
  const defaultFilters: { [key: string]: boolean } = {
    Active: false,
    Completed: false,
    Expired: false,
  }
  const [proposalStatusFilters, setProposalStatusFilters] = useState(defaultFilters)
  const proposalStatuses = Object.keys(defaultFilters)

  const updateStatusFilter = (status: string, value: boolean) => {
    const newFilters = {
      ...proposalStatusFilters,
      [status]: value,
    }
    setProposalStatusFilters(newFilters)
    const enabledFilters: string[] = Object.keys(newFilters).filter((key) => newFilters[key])

    applyFilter?.(enabledFilters)
  }

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'flex w-full flex-row flex-wrap justify-start gap-2'}>
        {proposalStatuses.map((status) => (
          <Toggle
            pressed={proposalStatusFilters[status]}
            onPressedChange={(newValue) => updateStatusFilter(status, newValue)}
            key={status}
            size={'sm'}
            variant={'outline'}
            aria-label={'Toggle ' + status + ' Filter'}
            className={
              'data-[state=on]:bg-sun-highlight-primary/50 data-[state=on]:text-sun-white-pure sun-text-14-rg border-2'
            }
          >
            {status}
          </Toggle>
        ))}
      </div>
      <Button
        size={'sm'}
        className={'w-fit'}
        onClick={() => {
          setProposalStatusFilters(defaultFilters)
          const enabledFilters: string[] = Object.keys(defaultFilters).filter(
            (key) => defaultFilters[key]
          )
          applyFilter?.(enabledFilters)
        }}
      >
        Reset
      </Button>
    </div>
  )
}
