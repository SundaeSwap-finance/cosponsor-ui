import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { iProposalCardData } from '@/types/Proposal'
import { CardProposalExpired } from '@/components/proposals/CardProposalExpired'
import { CardProposalUserPledged } from '@/components/proposals/CardProposalUserPledged'
import { CardProposalProgress } from '@/components/proposals/CardProposalProgress'
import { useEffect, useState } from 'react'

export const ProposalStatusCardBase = ({
  proposal,
}: {
  proposal: iProposalCardData | undefined
}) => {
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!proposal || isExpired) {
      return
    }
    let timer: Timer | undefined

    const timeRemaining = proposal.expiryDate.getTime() - new Date().getTime()

    if (timeRemaining <= 0) {
      setIsExpired(true)
    } else {
      // Set a timer to re-run this check at the exact moment of expiration
      timer = setTimeout(() => {
        setIsExpired(true)
      }, timeRemaining)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [proposal, isExpired])

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
