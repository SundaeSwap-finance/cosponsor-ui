import { CardProposal } from '@/components/proposals/CardProposal'
import { IProposalCardData } from '@/types/Proposal'

export const ListSimpleProposals = ({ proposals }: { proposals?: IProposalCardData[] }) => {
  return (
    <div className={'flex flex-col items-center gap-2.5 lg:flex-row lg:flex-wrap lg:justify-start'}>
      {proposals?.map((item) => (
        // Prefer the on-chain proposal hash for keying when present: two
        // pledges on the same proposal but pre/post Stage-1 fix can share
        // the same display id (govTools URL id), so keying on `item.id`
        // alone risks duplicate React keys and the wrong modal getting
        // mounted under a clicked Sponsor button.
        <CardProposal
          key={item.proposalHash ?? item.id}
          proposal={item}
          className={'max-lg:!max-w-120'}
        />
      ))}
    </div>
  )
}
