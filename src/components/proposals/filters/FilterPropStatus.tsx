import { useState } from 'react'
import { Toggle } from '@/components/shadcn/toggle'

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
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full justify-start'}>Proposal Status</div>
      <div className={'flex w-full flex-row flex-wrap justify-start gap-2'}>
        {proposalStatuses.map((status) => (
          <Toggle
            onPressedChange={(newValue) => updateStatusFilter(status, newValue)}
            key={status}
            size={'sm'}
            variant={'outline'}
            aria-label={'Toggle ' + status + ' Filter'}
            className={
              'data-[state=on]:border-sun-highlight-primary/30 data-[state=on]:bg-sun-white-pure border-2'
            }
          >
            {status}
          </Toggle>
        ))}
      </div>
    </div>
  )
}
