import { IProposalCardData } from '@/types/Proposal'
import { CardProposalExpired } from '@/components/proposals/state/CardProposalExpired'
import { CardProposalUserPledged } from '@/components/proposals/state/CardProposalUserPledged'
import { CardProposalProgress } from '@/components/proposals/state/CardProposalProgress'

export const ProposalStatusCardBase = ({
  proposal,
  isExpired,
}: {
  proposal: IProposalCardData | undefined
  isExpired?: boolean
}) => {
  if (proposal && isExpired) {
    return <CardProposalExpired userPledge={proposal?.userPledged} />
  } else if (proposal && proposal?.userPledged) {
    return (
      <CardProposalUserPledged
        cosponsorTarget={proposal?.cosponsorTarget}
        userPledge={proposal?.userPledged}
      />
    )
  } else if (proposal) {
    return (
      <CardProposalProgress
        fundProgress={proposal?.pledgedAmount}
        cosponsorTarget={proposal?.cosponsorTarget}
      />
    )
  } else {
    return <></>
  }
}
