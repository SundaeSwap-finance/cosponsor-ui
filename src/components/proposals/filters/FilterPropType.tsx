import { Toggle } from '@/components/shadcn/toggle'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { useEffect, useState } from 'react'
import { Button } from '@/components/shadcn/button'

const proposalTypes = [
  'Confidence',
  'Committee',
  'Constitution',
  'Hardfork',
  'Protocol',
  'Treasury',
  'Info',
]

type propTypes = (typeof proposalTypes)[number] | undefined

export const FilterPropType = ({
  applyFilter,
}: {
  applyFilter?: (filters: propTypes[]) => void
}) => {
  const [proposalTypeFilters, setProposalTypeFilters] = useState<propTypes[]>([])

  const updateTypeFilter = (type: propTypes, enabled: boolean) => {
    let newFilters: propTypes[] = []

    if (enabled) {
      newFilters = proposalTypeFilters.slice(0)
      newFilters.push(type)
    } else {
      newFilters = proposalTypeFilters.filter((item) => item !== type)
    }

    setProposalTypeFilters(newFilters)

    applyFilter?.(newFilters)
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full flex-row flex-wrap justify-start gap-2'}>
        {proposalTypes.map((type) => (
          <Toggle
            pressed={proposalTypeFilters.includes(type)}
            onPressedChange={(newValue) => updateTypeFilter(type, newValue)}
            key={type}
            size={'sm'}
            aria-label={'Toggle ' + type + ' Filter'}
            className={'data-[state=on]:bg-sun-highlight-primary/50 h-fit p-0'}
          >
            <BadgeProposalCategory
              category={type}
              className={
                'sun-text-12-md flex h-6 items-center justify-center ' +
                (proposalTypeFilters.includes(type) ? ' text-sun-white-pure' : ' ')
              }
            />
          </Toggle>
        ))}
      </div>
      <Button
        size={'sm'}
        className={'w-fit'}
        onClick={() => {
          setProposalTypeFilters([])
          applyFilter?.([])
        }}
      >
        Reset
      </Button>
    </div>
  )
}
