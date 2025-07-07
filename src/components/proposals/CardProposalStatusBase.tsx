import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { iProposalCardData } from '@/types/Proposal'
import { CardProposalExpired } from '@/components/proposals/CardProposalExpired'
import { CardProposalUserPledged } from '@/components/proposals/CardProposalUserPledged'
import { CardProposalProgress } from '@/components/proposals/CardProposalProgress'
import { useEffect, useState } from 'react'

export const ProposalStatusCardBase = ({
  proposal,
  isExpired,
}: {
  proposal: iProposalCardData | undefined
  isExpired?: boolean
}) => {
  if (proposal && isExpired) {
    return <CardProposalExpired userPledge={proposal?.userPledged} />
  } else if (proposal && proposal?.userPledged) {
    return (
      <CardProposalUserPledged
        fundProgress={proposal?.pledgedAmount}
        reqBudget={proposal?.requestedBudget}
        userPledge={proposal?.userPledged}
      />
    )
  } else if (proposal) {
    return (
      <CardProposalProgress
        fundProgress={proposal?.pledgedAmount}
        reqBudget={proposal?.requestedBudget}
      />
    )
  } else {
    return <></>
  }
}
