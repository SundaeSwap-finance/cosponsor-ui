import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { Button } from '@/components/shadcn/button'
import { ArrowRight, MoveRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { iProposalCardData } from '@/types/Proposal'
import { useNumberFormatter } from '@/composables/useNumberFormatter'

export const SearchResultProposal = ({ proposal }: { proposal: iProposalCardData }) => {
  const { formatNumber } = useNumberFormatter()
  const proposalOwnerName = 'drep_username'
  const proposalTitle = 'ProposalTitle number one'
  const proposalCategory = 'Treasury'
  const proposalId = 2
  const proposalPercentage = 67

  return (
    <Link
      to={'/proposal/' + proposal.id}
      className={
        'group/searchItem flex cursor-pointer flex-row items-center justify-between px-3 py-2'
      }
    >
      <div className={'flex flex-col gap-2'}>
        <div className={'sun-text-16-md text-sun-header max-w-[320px] truncate'}>
          {proposal.name}
        </div>
        <div className={'flex flex-row items-center gap-3'}>
          <div className={'text-sun-muted sun-text-12-md flex flex-row items-center gap-2'}>
            <div>Created by</div>
            <div
              className={'text-sun-default underline decoration-dotted underline-offset-3'}
              title={'UserId: ' + proposalOwnerName}
            >
              @{proposal.ownerName.slice(0, 16)}
            </div>
          </div>
          <BadgeProposalCategory category={proposal.categoryName} />
        </div>
      </div>
      <BadgeProposalPercent
        percentage={formatNumber((proposal.pledgedAmount / proposal.requestedBudget) * 100)}
        className={'transition-all duration-600'}
      />
      <Button
        size="icon"
        variant="secondary"
        className={'hidden transition-all duration-600 group-hover/searchItem:flex'}
      >
        <MoveRight />
      </Button>
    </Link>
  )
}
