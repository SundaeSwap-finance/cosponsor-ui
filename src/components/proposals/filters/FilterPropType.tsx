import { Toggle } from '@/components/shadcn/toggle'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { useMemo, useState } from 'react'

export const FilterPropType = () => {
  const defaultFilters: { [key: string]: boolean } = {
    Confidence: false,
    Committee: false,
    Constitution: false,
    Hardfork: false,
    Protocol: false,
    Treasury: false,
    Info: false,
  }
  const [proposalFilters, setProposalFilters] = useState(defaultFilters)
  const currentFilters = useMemo(() => {
    return proposalFilters
  }, [proposalFilters])
  const proposalTypes = Object.keys(proposalFilters)

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex w-full justify-center'}>Proposal Types</div>
      <div className={'flex flex-row flex-wrap gap-2'}>
        {proposalTypes.map((type) => (
          <Toggle
            onPressedChange={(newValue) =>
              setProposalFilters({
                ...proposalFilters,
                [type]: newValue,
              })
            }
            key={type}
            size={'sm'}
            aria-label={'Toggle ' + type + ' Filter'}
            className={'data-[state=on]:bg-sun-highlight-primary/50 h-fit p-0'}
          >
            <BadgeProposalCategory
              category={type}
              className={
                'sun-text-12-md flex h-6 items-center justify-center ' +
                (currentFilters[type] ? ' text-sun-white-pure' : ' ')
              }
            />
          </Toggle>
        ))}
      </div>
    </div>
  )
}
