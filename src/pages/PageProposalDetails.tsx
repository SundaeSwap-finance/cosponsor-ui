import { Link, useParams } from 'react-router-dom'
import { iProposalDetailsData } from '@/types/Proposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { useMemo } from 'react'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { getShortDate } from '@/composables/useDateTime'
import { ChevronLeft, Vote } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { cn } from '@/lib/utils'
import { ProgressMilestones } from '@/components/graphics/ProgressMilestones'

export const PageProposalDetails = () => {
  const { proposalId } = useParams()
  const { getProposalDetailsById } = useGetProposalData()

  const proposal = useMemo(() => {
    const foundProposal = getProposalDetailsById(proposalId as string)
    if (!foundProposal) {
      console.warn('No proposal found for this id')
      return
    }
    return foundProposal
  }, [])

  const initDate = useMemo(() => getShortDate(proposal?.initDate), [proposal?.initDate])
  const expiryDate = useMemo(() => getShortDate(proposal?.expiryDate), [proposal?.expiryDate])

  const completionPercentage = useMemo((): number => {
    if (proposal?.pledgedAmount && proposal?.requestedBudget) {
      return (proposal?.pledgedAmount / proposal?.requestedBudget) * 100
    }
    return -1
  }, [proposal?.pledgedAmount, proposal?.requestedBudget])

  return (
    proposal && (
      <div className={'sun-page-padding-rb flex h-full w-full flex-col gap-8'}>
        <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
        <div
          className={
            'border-b-sun-border-secondary flex h-full w-full flex-col justify-between gap-4 border-b pb-6 md:flex-row'
          }
        >
          <div className={'flex flex-col gap-4'}>
            <h1 className={'text-sun-header sun-text-28-md'}>
              Name of the proposal here can be very long {proposalId}
            </h1>
            <div className={'sun-text-14-md text-sun-default flex flex-row gap-1'}>
              <div>Created by</div>
              <div className={'text-sun-muted underline decoration-dotted underline-offset-4'}>
                {proposal.ownerId}
              </div>
            </div>
            <div className={'sun-text-14-md text-sun-default flex flex-row gap-6'}>
              <div className={'flex flex-row gap-1'}>
                <div>Proposed on</div>
                <div className={'text-sun-muted'}>{initDate}</div>
              </div>
              <div className={'flex flex-row gap-1'}>
                <div>Expires on</div>
                <div className={'text-sun-muted'}>{expiryDate}</div>
              </div>
              <div className={'flex flex-row gap-1'}>
                <div>Budget Category</div>
                <BadgeProposalCategory
                  category={proposal.categoryName ?? ''}
                  className={'sun-text-12-md'}
                />
              </div>
            </div>
          </div>
          <div className={'flex flex-row items-end gap-2'}>
            <Button variant="secondary" size="lg" asChild>
              <Link to={'/all'}>
                <ChevronLeft />
                Back
              </Link>
            </Button>
            <ButtonGradient className={'flex-1'} size="lg">
              <Vote />
              Sponsor this proposal
            </ButtonGradient>
          </div>
        </div>
        <div className={'flex flex-row gap-12'}>
          <div className={'flex w-full flex-col gap-6'}>
            <div className={'flex flex-col gap-4'}>
              <div className={'flex flex-row items-center justify-between'}>
                <div className={'sun-text-22-md text-sun-header'}>
                  {(completionPercentage as number).toPrecision(4)}% sponsored
                </div>
                <div className={'flex flex-row items-end'}>
                  <div className={'sun-text-22-md text-sun-header'}>
                    ₳{proposal.pledgedAmount.toFixed(2)}
                  </div>
                  <div className={'sun-text-18-md text-sun-muted'}>
                    /₳{proposal.requestedBudget.toFixed(2)}
                  </div>
                </div>
              </div>
              <ProgressMilestones value={completionPercentage} milestones={[0, 25, 50, 75, 100]} />
            </div>
            <div className={'bg-sun-border-primary h-[1px] w-full'} />
            <div>TODO: Details of the details</div>
          </div>
          <div
            className={
              'border-sun-border-primary flex w-fit min-w-75 flex-col gap-3 rounded-2xl border p-6'
            }
          >
            <div
              className={
                'border-sun-border-primary sun-text-22-md text-sun-header flex border-b pb-4'
              }
            >
              Proposal Sponsors
            </div>
            <div className={'flex flex-col gap-2'}></div>
          </div>
        </div>
      </div>
    )
  )
}
