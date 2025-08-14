import { Button } from '@/components/shadcn/button'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { useContext, useEffect, useMemo, useState } from 'react'
import { iProposalCardData } from '@/types/Proposal'
import { getShortDate } from '@/composables/useDateTime'
import { ProposalStatusCardBase } from '@/components/proposals/CardProposalStatusBase'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { ModalSponsor } from '@/components/modals/proposalAction/ModalSponsor'
import { ModalWithdraw } from '@/components/modals/proposalAction/ModalWithdraw'
import { useWalletObserver } from '@sundaeswap/wallet-lite'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { ButtonSponsor } from '@/components/button/ButtonSponsor'
import { ButtonWithdraw } from '@/components/button/ButtonWithdraw'

export const CardProposal = ({
  proposal,
  className,
}: {
  proposal: iProposalCardData
  className?: string
}) => {
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const initDate = useMemo(() => getShortDate(proposal?.initDate), [proposal?.initDate])
  const expiryDate = useMemo(() => getShortDate(proposal?.expiryDate), [proposal?.expiryDate])
  const completionPercentage = useMemo(() => {
    if (proposal?.pledgedAmount && proposal?.requestedBudget) {
      return ((proposal?.pledgedAmount / proposal?.requestedBudget) * 100).toPrecision(4)
    }
    return 'n/a'
  }, [proposal?.pledgedAmount, proposal?.requestedBudget])

  useEffect(() => {
    if (!proposal || isExpired) {
      return
    }
    let timer: Timer | undefined

    const timeRemaining = proposal.expiryDate.getTime() - new Date().getTime()
    const oneDayTimerLimit = 60000 * 60 * 24

    if (timeRemaining <= 0) {
      setIsExpired(true)
    } else if (timeRemaining < oneDayTimerLimit) {
      timer = setTimeout((remains) => {
        setIsExpired(true)
      }, timeRemaining)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [proposal, isExpired])

  return (
    // TODO: skeleton loading to prevent flicker.
    <div
      className={cn(
        'border-sun-border-secondary divide-sun-border-primary flex h-[492px] w-full max-w-[90vw] flex-col divide-y rounded-xl border transition-all duration-500 md:max-w-100',
        className
      )}
    >
      <div className={'flex h-12.5 flex-row items-center justify-between px-6 py-4'}>
        <div className={'text-sun-muted sun-text-12-md flex flex-row gap-2'}>
          <div>Created by</div>
          <div
            className={'text-sun-default underline decoration-dotted underline-offset-3'}
            title={'UserId: ' + proposal?.ownerId}
          >
            @{proposal?.ownerName.slice(0, 16)}
          </div>
        </div>
        <BadgeProposalPercent percentage={completionPercentage} isExpired={isExpired} />
      </div>

      <div className={'flex min-h-25 w-full grow flex-col gap-4 px-6 py-4'}>
        <div className={'flex flex-col gap-2'}>
          <h2 className={'text-sun-header sun-text-18-sb'}> {proposal?.name}</h2>
          <div className={'flex flex-row gap-4'}>
            <div className={'flex flex-row gap-1'}>
              <div className={'sun-text-12-md text-sun-default'}>Proposed on</div>
              <div className={'sun-text-12-md text-sun-muted'}>{initDate}</div>
            </div>
            <div className={'flex flex-row gap-1'}>
              <div className={'sun-text-12-md text-sun-default'}>Expires on</div>
              <div className={'sun-text-12-md text-sun-muted'}>{expiryDate}</div>
            </div>
            <BadgeProposalCategory category={proposal?.categoryName as string} />
          </div>
        </div>

        <ProposalStatusCardBase proposal={proposal} isExpired={isExpired} />

        <div className={'flex w-full flex-row gap-4'}>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted sun-text-12-md'}>Company</div>
            <div className={'sun-text-14-md text-sun-default'}>{proposal?.companyName}</div>
          </div>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted sun-text-12-md'}>Domain</div>
            <div className={'sun-text-14-md text-sun-default'}>{proposal?.companyDomain}</div>
          </div>
        </div>
        <div className={'flex w-full flex-col gap-1.5'}>
          <div className={'text-sun-muted sun-text-12-md'}>Abstract</div>
          <div
            className={cn(
              proposal?.userPledged && !isExpired
                ? 'line-clamp-2 xl:line-clamp-3'
                : 'line-clamp-3 xl:line-clamp-4',
              'sun-text-14-md text-sun-header'
            )}
          >
            {proposal?.abstract}
          </div>
        </div>
      </div>
      {!isExpired || proposal.userPledged > 0 ? (
        <div className={'flex w-full flex-row gap-2 px-6 py-4'}>
          {isExpired && proposal.userPledged > 0 ? (
            <ButtonWithdraw proposal={proposal} content={'Withdraw Your Pledge'} />
          ) : (
            <>
              <Button size="lg" className={'flex-1'} asChild>
                <Link to={'/proposal/' + proposal.id}>View Details</Link>
              </Button>
              <ButtonSponsor proposalId={proposal.id} content={'Sponsor!'} />
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
