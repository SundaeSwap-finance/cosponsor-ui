import { CardProposal } from '@/components/proposals/CardProposal'
import { iProposalCardData } from '@/types/Proposal'

export const ListSimpleProposals = ({ proposals }: { proposals?: iProposalCardData[] }) => {
  return (
    <div className={'flex flex-col items-center gap-2.5 lg:flex-row lg:flex-wrap lg:justify-start'}>
      {proposals?.map((item, index) => (
        <CardProposal key={item.id} proposal={item} className={'max-lg:!max-w-120'} />
      ))}
    </div>
  )
}
