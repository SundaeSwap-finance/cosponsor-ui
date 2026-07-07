import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ListFilter } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover'
import { useMemo, useState } from 'react'
import {
  FilterPropBudget,
  FilterPropExpiration,
  FilterPropFundProgress,
  FilterPropStatus,
  FilterPropType,
} from '@/components/proposals/filters'
import { IProposalFilters } from '@/types/IProposalFilters'

export const ButtonProposalFilter = ({
  onTypeFilter,
  onFiltersChange,
}: {
  onTypeFilter?: (filters: string[]) => void
  onFiltersChange?: (filters: IProposalFilters) => void
}) => {
  const [filterView, setFilterView] = useState('')
  const [currentFilters, setCurrentFilters] = useState<IProposalFilters>({})

  const isDefaultView = useMemo(() => filterView.length === 0, [filterView])

  const updateFilters = (patch: Partial<IProposalFilters>) => {
    const updated = { ...currentFilters, ...patch }
    setCurrentFilters(updated)
    onFiltersChange?.(updated)
  }

  const filterComponents: { [key: string]: React.ReactNode } = {
    'Proposal Type': (
      <FilterPropType
        applyFilter={(filters) =>
          onTypeFilter?.(filters.filter((f): f is string => f !== undefined))
        }
      />
    ),
    Status: (
      <FilterPropStatus
        applyFilter={(filters) =>
          updateFilters({ status: filters.length > 0 ? filters : undefined })
        }
      />
    ),
    'Funding Progress': (
      <FilterPropFundProgress
        applyFilter={(value) => {
          const isDefault = value[0] === 0 && value[1] === 100
          updateFilters({
            fundProgress: isDefault ? undefined : (value as [number, number]),
          })
        }}
      />
    ),
    'Requested Budget': (
      <FilterPropBudget
        applyFilter={(value) => {
          const isDefault = value[0] === 0 && value[1] === 100000
          updateFilters({
            budget: isDefault ? undefined : (value as [number, number]),
          })
        }}
      />
    ),
    Expiration: (
      <FilterPropExpiration
        applyFilter={(dates) => {
          const isDefault = !dates[0] && !dates[1]
          updateFilters({
            expiration: isDefault ? undefined : (dates as [Date | undefined, Date | undefined]),
          })
        }}
      />
    ),
    // 'Creator / dRep' filter hidden for public testing: FilterPropCreator
    // still renders a hardcoded fake user list and isn't wired to filtering
    // (no applyFilter). Re-add here once it filters real creators.
  }
  const mainFilters = Object.keys(filterComponents)
  const activeFilterComponent = filterComponents[filterView] || null

  const MainFilterList = () => {
    return (
      <div className={'flex flex-col gap-2'}>
        {mainFilters.map((filter, _i) => (
          <div
            onClick={() => {
              setFilterView(filter)
            }}
            className={
              'sun-text-12-rg text-sun-default flex h-6.5 cursor-pointer items-center transition-transform duration-1000 hover:pl-1'
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
        align={'start'}
        className={'bg-sun-white-pure divide-sun-border-primary flex w-fit flex-col divide-y px-0'}
      >
        <div className={'sun-text-14-md w-55 w-full px-4 pb-3'}>Filter by {filterView}</div>

        <div className={'max-w-70 px-4 pt-3'}>
          {(() => {
            if (isDefaultView) {
              return <MainFilterList />
            } else {
              return (
                <div className={'flex flex-col gap-8'}>
                  <Button
                    size={'sm'}
                    variant={'outline'}
                    className={'w-fit gap-1'}
                    onClick={() => setFilterView('')}
                  >
                    <ChevronLeft className={'size-4'} />
                    Back
                  </Button>
                  <div className={'w-full'}>{activeFilterComponent}</div>
                </div>
              )
            }
          })()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
