import React from 'react'
import { Button } from '@/components/shadcn/button'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { useEffect, useMemo, useState } from 'react'
import { IProposalCardData } from '@/types/Proposal'
import { getShortDate } from '@/composables/useDateTime'
import { ProposalStatusCardBase } from '@/components/proposals/state/CardProposalStatusBase'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { ButtonSponsor } from '@/components/button/ButtonSponsor'
import { ButtonWithdraw } from '@/components/button/ButtonWithdraw'
import { Skeleton } from '@/components/shadcn/skeleton'

export const CardProposalSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'border-sun-border-secondary divide-sun-border-primary flex h-[492px] w-full max-w-[90vw] flex-col divide-y rounded-xl border md:max-w-100',
        className
      )}
    >
      <div className={'flex h-12.5 flex-row items-center justify-between px-6 py-4'}>
        <Skeleton className={'h-4 w-32'} />
        <Skeleton className={'h-5 w-12 rounded-full'} />
      </div>
      <div className={'flex min-h-25 w-full grow flex-col gap-4 px-6 py-4'}>
        <div className={'flex flex-col gap-2'}>
          <Skeleton className={'h-6 w-3/4'} />
          <div className={'flex flex-row gap-4'}>
            <Skeleton className={'h-4 w-24'} />
            <Skeleton className={'h-4 w-24'} />
            <Skeleton className={'h-5 w-16 rounded-full'} />
          </div>
        </div>
        <div className={'flex flex-col gap-2'}>
          <Skeleton className={'h-3 w-full'} />
          <Skeleton className={'h-6 w-full rounded-full'} />
        </div>
        <div className={'flex w-full flex-row gap-4'}>
          <div className={'flex w-full flex-col gap-1.5'}>
            <Skeleton className={'h-3 w-16'} />
            <Skeleton className={'h-4 w-24'} />
          </div>
          <div className={'flex w-full flex-col gap-1.5'}>
            <Skeleton className={'h-3 w-16'} />
            <Skeleton className={'h-4 w-24'} />
          </div>
        </div>
        <div className={'flex w-full flex-col gap-1.5'}>
          <Skeleton className={'h-3 w-16'} />
          <Skeleton className={'h-4 w-full'} />
          <Skeleton className={'h-4 w-5/6'} />
          <Skeleton className={'h-4 w-2/3'} />
        </div>
      </div>
      <div className={'flex w-full flex-row gap-2 px-6 py-4'}>
        <Skeleton className={'h-10 flex-1 rounded-md'} />
        <Skeleton className={'h-10 w-24 rounded-md'} />
      </div>
    </div>
  )
}

export const CardProposal = ({
  proposal,
  className,
}: {
  proposal: IProposalCardData
  className?: string
}) => {
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const initDate = useMemo(() => getShortDate(proposal.initDate), [proposal.initDate])
  const expiryDate = useMemo(() => getShortDate(proposal.expiryDate), [proposal.expiryDate])
  const completionPercentage = useMemo(() => {
    if (proposal.pledgedAmount && proposal.cosponsorTarget) {
      const pct = (proposal.pledgedAmount / proposal.cosponsorTarget) * 100
      // Clamp the badge at 100%: a pool can hold more than the deposit target
      // (e.g. after a gov_action_deposit param drop), but ">100% Funded" reads
      // as broken.
      return pct >= 100 ? '100' : pct.toPrecision(4)
    }
    return 'n/a'
  }, [proposal.pledgedAmount, proposal.cosponsorTarget])

  useEffect(() => {
    if (!proposal || isExpired) {
      return
    }
    let timer: ReturnType<typeof setTimeout> | undefined

    const timeRemaining = proposal.expiryDate.getTime() - new Date().getTime()
    const oneDayTimerLimit = 60000 * 60 * 24

    if (timeRemaining <= 0) {
      setIsExpired(true)
    } else if (timeRemaining < oneDayTimerLimit) {
      timer = setTimeout(() => {
        setIsExpired(true)
      }, timeRemaining)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [proposal, isExpired])

  return (
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
            title={`UserId: ${proposal?.ownerId}`}
          >
            @{proposal?.ownerName?.slice(0, 16)}
          </div>
        </div>
        <BadgeProposalPercent percentage={completionPercentage} isExpired={isExpired} />
      </div>

      <div className={'flex min-h-25 w-full grow flex-col gap-4 overflow-hidden px-6 py-4'}>
        <div className={'flex flex-col gap-2'}>
          <h2 className={'text-sun-header sun-text-18-sb line-clamp-2 break-words'}>
            {' '}
            {proposal?.name}
          </h2>
          {/* Dates stay on one row, nowrapped. Category badge wraps to its
              own line when the dates row + a long category name (e.g.
              "No Confidence", "Constitutional Committee") would otherwise
              squeeze the dates into 2 lines. */}
          <div className={'flex flex-row flex-wrap items-center gap-x-4 gap-y-2'}>
            <div className={'flex flex-col gap-1 text-nowrap md:flex-row'}>
              <div className={'sun-text-12-md text-sun-default'}>Proposed on</div>
              <div className={'sun-text-12-md text-sun-muted'}>{initDate}</div>
            </div>
            <div className={'flex flex-col gap-1 text-nowrap md:flex-row'}>
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
        {/* Abstract takes up significant vertical space; on cards where the
            user has an active pledge we already surface pledge + target +
            three actions, so suppress the abstract to keep the card
            visually balanced. Expired-with-pledge keeps showing it because
            the action row is collapsed to a single Withdraw button. */}
        {!(proposal?.userPledged && !isExpired) && (
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted sun-text-12-md'}>Abstract</div>
            <div
              className={cn(
                'line-clamp-3 break-words xl:line-clamp-4',
                'sun-text-14-md text-sun-header'
              )}
            >
              {proposal?.abstract}
            </div>
          </div>
        )}
      </div>
      {!isExpired || proposal.userPledged > 0 ? (
        <div className={'flex w-full flex-col gap-2 px-6 py-4'}>
          {isExpired && proposal.userPledged > 0 ? (
            <ButtonWithdraw proposal={proposal} content={'Withdraw Your Pledge'} />
          ) : proposal.userPledged > 0 ? (
            // User has an active pledge: surface Withdraw alongside Sponsor!
            // and promote View Details to a full-width primary action above.
            <>
              <Button size="lg" className={'w-full'} asChild>
                <Link to={`/proposal/${proposal.id}`}>View Details</Link>
              </Button>
              <div className={'flex w-full flex-row gap-2'}>
                <ButtonWithdraw proposal={proposal} content={'Withdraw'} classButton={'flex-1'} />
                <ButtonSponsor proposalId={proposal.id} proposal={proposal} content={'Sponsor!'} />
              </div>
            </>
          ) : (
            <div className={'flex w-full flex-row gap-2'}>
              <Button size="lg" className={'flex-1'} asChild>
                <Link to={`/proposal/${proposal.id}`}>View Details</Link>
              </Button>
              <ButtonSponsor proposalId={proposal.id} proposal={proposal} content={'Sponsor!'} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
