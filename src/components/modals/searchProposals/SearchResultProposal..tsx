import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { Button } from '@/components/shadcn/button'
import { MoveRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { iProposalCardData } from '@/types/Proposal'

export const SearchResultProposal = ({ proposal }: { proposal: iProposalCardData }) => {
  return (
    <Link
      to={'/proposal/' + proposal.id}
      className={
        'flex w-full cursor-pointer flex-row items-center justify-between px-3 py-2 transition-all duration-600'
      }
    >
      <div className={'flex flex-col gap-2'}>
        <div className={'sun-text-16-md text-sun-header max-w-[320px] truncate'}>
          {proposal.name}
        </div>
        <div className={'flex flex-row items-start gap-3 md:items-center'}>
          <div
            className={
              'text-sun-muted sun-text-12-md flex flex-col items-start gap-2 md:flex-row md:items-center'
            }
          >
            <div>Created by</div>
            <div
              className={'text-sun-default underline decoration-dotted underline-offset-3'}
              title={'UserId: ' + proposal.ownerName}
            >
              @{proposal.ownerName.slice(0, 16)}
            </div>
          </div>
          <div className={'flex flex-col gap-0.5'}>
            <BadgeProposalCategory category={proposal.categoryName} />
            <BadgeProposalPercent
              percentage={((proposal.pledgedAmount / proposal.requestedBudget) * 100).toPrecision(
                4
              )}
              className={'flex transition-transform duration-600 md:hidden'}
            />
          </div>
        </div>
      </div>

      <div className={'hidden h-full flex-row items-center gap-3 md:flex'}>
        <BadgeProposalPercent
          percentage={((proposal.pledgedAmount / proposal.requestedBudget) * 100).toPrecision(4)}
          className={'transition-transform duration-600'}
        />
        <Button
          size="icon"
          variant="secondary"
          className={'hidden group-data-[selected=true]/searchItem:md:flex'}
        >
          <MoveRight />
        </Button>
      </div>
    </Link>
  )
}
