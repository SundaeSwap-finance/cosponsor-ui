import { cn } from '@/lib/utils'
import { ChevronLeft, ListFilter } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover'
import { useMemo, useState } from 'react'
import {
  FilterPropBudget,
  FilterPropCreator,
  FilterPropExpiration,
  FilterPropFundProgress,
  FilterPropStatus,
  FilterPropType,
} from '@/components/proposals/filters'

// TODO: review component visuals before adding actual filtering logic
export const ButtonProposalFilter = () => {
  const [filterView, setFilterView] = useState('')

  const isDefaultView = useMemo(() => filterView.length == 0, [filterView])

  const filterComponents: { [key: string]: React.ReactNode } = {
    'Proposal Type': <FilterPropType />,
    Status: <FilterPropStatus />,
    'Funding Progress': <FilterPropFundProgress />,
    'Requested Budget': <FilterPropBudget />,
    Expiration: <FilterPropExpiration />,
    'Creator / dRep': <FilterPropCreator />,
  }
  const mainFilters = Object.keys(filterComponents)
  const activeFilterComponent = filterComponents[filterView] || null

  const MainFilterList = () => {
    return (
      <div className={'flex flex-col gap-2'}>
        {mainFilters.map((filter, i) => (
          <div
            onClick={() => {
              setFilterView(filter)
            }}
            className={
              'sun-text-12-rg text-sun-default flex h-6.5 cursor-pointer items-center transition-transform duration-200 hover:pl-1'
            }
            key={filter}
          >
            {filter}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn('!bg-sun-white-pure text-sun-header sun-text-12-md')}
        >
          <ListFilter />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={'bg-sun-white-pure divide-sun-border-primary flex w-fit flex-col divide-y px-0'}
      >
        {isDefaultView ? (
          <div className={'sun-text-14-md w-55 px-4 pb-3'}>Filter by</div>
        ) : (
          <div
            className={
              'sun-text-14-md flex w-70 cursor-pointer flex-row items-center gap-1 px-4 pb-3'
            }
            onClick={() => setFilterView('')}
          >
            <ChevronLeft className={'size-4'} />
            Back
          </div>
        )}
        <div className={'px-4 pt-3'}>
          {(() => {
            if (isDefaultView) {
              return <MainFilterList />
            } else {
              return <div className={'w-70'}>{activeFilterComponent}</div>
            }
          })()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
