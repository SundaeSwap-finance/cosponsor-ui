import { Button } from '@/components/shadcn/button'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { BadgeProposalTag } from '@/components/proposals/BadgeProposalTag'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { useEffect, useMemo, useState } from 'react'
import { getProposalCardData } from '@/composables/useGetProposalData'
import { iProposalCardData } from '@/types/Proposal'
import { getShortDate } from '@/composables/useDateTime'
import { ProposalStatusCardBase } from '@/components/proposals/CardProposalStatusBase'

export const CardProposal = ({ proposalId }: { proposalId: string }) => {
  const [proposal, setProposal] = useState<iProposalCardData>()
  const [expired, setExpired] = useState<boolean>()

  const initDate = useMemo(() => getShortDate(proposal?.initDate), [proposal?.initDate])
  const expiryDate = useMemo(() => getShortDate(proposal?.expiryDate), [proposal?.expiryDate])

  useEffect(() => {
    getProposalCardData(proposalId).then((response) => {
      if (response) {
        setProposal(response)
      }
    })
  }, [proposalId])

  const completionPercentage = useMemo(() => {
    if (proposal?.pledgedAmount && proposal?.requestedBudget) {
      return ((proposal?.pledgedAmount / proposal?.requestedBudget) * 100).toPrecision(4)
    }
    return 'n/a'
  }, [proposal?.pledgedAmount, proposal?.requestedBudget])

  return (
    <div
      className={
        'border-sun-border-secondary divide-sun-border-primary flex h-full w-full max-w-100 flex-col divide-y rounded-xl border'
      }
    >
      <div className={'flex h-12.5 flex-row items-center justify-between px-6 py-4'}>
        <div className={'text-sun-muted text-12-md flex flex-row gap-2'}>
          <div>Created by</div>
          <div className={'text-sun-default underline decoration-dotted underline-offset-3'}>
            @{proposal?.ownerId}
          </div>
        </div>
        <BadgeProposalPercent percentage={completionPercentage} />
      </div>

      <div className={'flex min-h-25 w-full flex-col gap-4 px-6 py-4'}>
        <div className={'flex flex-col gap-2'}>
          <h2 className={'text-sun-header text-18-sb'}> {proposal?.name}</h2>
          <div className={'flex flex-row gap-4'}>
            <div className={'flex flex-row gap-1'}>
              <div className={'text-12-md text-sun-default'}>Proposed on</div>
              <div className={'text-12-md text-sun-muted'}>{initDate}</div>
            </div>
            <div className={'flex flex-row gap-1'}>
              <div className={'text-12-md text-sun-default'}>Expires on</div>
              <div className={'text-12-md text-sun-muted'}>{expiryDate}</div>
            </div>
            <BadgeProposalTag tagName={proposal?.tagName as string} />
          </div>
        </div>
        <ProposalStatusCardBase proposal={proposal} />
        <div className={'flex w-full flex-row gap-4'}>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted text-12-md'}>Company</div>
            <div className={'text-14-md text-sun-default'}>{proposal?.companyName}</div>
          </div>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted text-12-md'}>Domain</div>
            <div className={'text-14-md text-sun-default'}>{proposal?.domain}</div>
          </div>
        </div>
        <div className={'flex w-full flex-col gap-1.5'}>
          <div className={'text-sun-muted text-12-md'}>Abstract</div>
          <div className={'text-14-md text-sun-header line-clamp-4'}>{proposal?.abstract}</div>
        </div>
      </div>
      <div className={'flex w-full flex-row gap-2 px-6 py-4'}>
        <Button className={'flex-1'}>View Details</Button>
        <ButtonGradient className={'flex-1'}>Sponsor!</ButtonGradient>
      </div>
    </div>
  )
}
