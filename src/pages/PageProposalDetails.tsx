import { Link, useParams } from 'react-router-dom'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { useEffect, useMemo, useState } from 'react'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { getShortDate, getShortDateAndTime } from '@/composables/useDateTime'
import { ArrowUpFromLine, ChevronLeft, Vote } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { ProgressMilestones } from '@/components/graphics/ProgressMilestones'
import { LabeledCopyId } from '@/components/proposals/LabeledCopyId'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { CardUserPledgeSimple } from '@/components/proposals/pageDetails/CardUserPledgeSimple'
import { CardProposalPledgeSingle } from '@/components/proposals/pageDetails/CardProposalPledgeSingle'
import { LabeledTextProposal } from '@/components/proposals/pageDetails/LabeledTextProposal'
import { BannerProposalExpired } from '@/components/proposals/pageDetails/BannerProposalExpired'
import { BannerProposalProgress } from '@/components/proposals/pageDetails/BannerProposalProgress'
import { ModalSponsor } from '@/components/modals/proposalAction/ModalSponsor'

export const PageProposalDetails = () => {
  const twoDayMilliseconds = 60000 * 60 * 48
  const { proposalId } = useParams()
  const { getProposalDetailsById } = useGetProposalData()

  const proposal = useMemo(() => {
    const foundProposal = getProposalDetailsById(proposalId as string)
    if (!foundProposal) {
      console.warn('No proposal found for this id')
      return
    }
    return foundProposal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId])

  const [isExpired, setIsExpired] = useState(
    proposal?.expiryDate ? new Date() > proposal.expiryDate : false
  )
  const initDate: string = useMemo(() => getShortDate(proposal?.initDate), [proposal?.initDate])
  const expiryDate: string = useMemo(
    () => getShortDate(proposal?.expiryDate),
    [proposal?.expiryDate]
  )
  const expiryDateTime: string = useMemo(
    () => getShortDateAndTime(proposal?.expiryDate),
    [proposal?.expiryDate]
  )
  const totalPledged: number = useMemo(() => {
    if (proposal?.pledges && proposal?.pledges.length > 0) {
      let countAmount = 0
      for (const pledge of proposal.pledges) {
        countAmount += pledge?.amount
      }
      return countAmount + proposal.userPledged
    } else {
      console.warn('Could not find pledges')
      return proposal?.pledgedAmount ?? 0
    }
  }, [proposal])

  const completionPercentage = useMemo((): number => {
    if (totalPledged && proposal?.requestedBudget) {
      return (totalPledged / proposal?.requestedBudget) * 100
    }
    return -1
  }, [totalPledged, proposal?.requestedBudget])

  useEffect(() => {
    if (!proposal || isExpired) {
      return
    }
    let timer: Timer | undefined

    const timeRemaining = proposal.expiryDate.getTime() - new Date().getTime()

    if (timeRemaining <= 0) {
      setIsExpired(true)
    } else if (timeRemaining < twoDayMilliseconds) {
      timer = setTimeout((remains) => {
        setIsExpired(true)
      }, timeRemaining)
    }

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal, isExpired])

  const expiryTitleTooltip = useMemo(() => {
    return (
      (isExpired ? 'Expired on ' : 'Expires on ') +
      expiryDateTime +
      ' ' +
      Intl.DateTimeFormat().resolvedOptions().timeZone +
      ' time'
    )
  }, [expiryDateTime, isExpired])

  return proposal ? (
    <div className={'sun-page-padding-rb flex h-full w-full flex-col gap-8'}>
      <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
      <div
        className={
          'border-b-sun-border-secondary flex h-full w-full flex-col justify-between gap-4 border-b pb-6 lg:flex-row'
        }
      >
        <div className={'flex flex-col gap-4'}>
          <h1 className={'text-sun-header sun-text-28-md'}>{proposal.name}</h1>
          <div
            className={
              'sun-text-14-md text-sun-default flex w-full flex-col gap-1 overflow-x-hidden md:flex-row'
            }
          >
            <div>Created by</div>
            <div className={'text-sun-muted underline decoration-dotted underline-offset-4'}>
              {proposal.ownerId}
            </div>
          </div>
          <div className={'sun-text-14-md text-sun-default flex flex-col gap-6 md:flex-row'}>
            <div className={'flex flex-row items-center gap-1'}>
              <div>Proposed on</div>
              <div className={'text-sun-muted'}>{initDate}</div>
            </div>
            <div className={'flex flex-row items-center gap-1'} title={expiryTitleTooltip}>
              <div className={'underline decoration-dotted underline-offset-4'}>
                {isExpired ? 'Expired on' : 'Expires on'}
              </div>
              <div className={'text-sun-muted'}>{expiryDate}</div>
            </div>
            <div className={'flex flex-row items-center gap-1'}>
              <div>Budget Category</div>
              <BadgeProposalCategory
                category={proposal.categoryName ?? ''}
                className={'sun-text-12-md'}
              />
            </div>
            {isExpired && (
              <div className={'flex flex-row items-center gap-1'}>
                Status
                <BadgeProposalPercent percentage={'-1'} isExpired={isExpired} />
              </div>
            )}
          </div>
        </div>
        <div className={'flex flex-row items-end gap-2'}>
          <Button variant="secondary" size="lg" asChild className={'sun-text-16-rg h-12 !px-6'}>
            <Link to={'/all'}>
              <ChevronLeft />
              Back
            </Link>
          </Button>
          {!isExpired && (
            <ModalSponsor
              modalTrigger={
                <ButtonGradient className={'sun-text-16-rg h-12 !px-5 lg:flex-1'} size="lg">
                  <Vote />
                  Sponsor this proposal
                </ButtonGradient>
              }
            />
          )}
        </div>
      </div>
      <div className={'flex w-full flex-col gap-12 lg:flex-row'}>
        <div className={'flex w-full flex-col gap-6 md:min-w-100'}>
          <>
            {isExpired ? (
              <BannerProposalExpired userPledge={proposal.userPledged} proposal={proposal} />
            ) : (
              <BannerProposalProgress
                completionPercentage={completionPercentage}
                totalPledged={totalPledged}
                requestedBudget={proposal.requestedBudget}
              />
            )}
          </>
          <div className={'bg-sun-border-primary h-[1px] w-full'} />
          <div className={'flex flex-col gap-12'}>
            <div className={'flex flex-col gap-6'}>
              <div className={'sun-text-20-md text-sun-header leading-5'}>Proposal Ownership</div>
              <div className={'flex flex-col gap-3 md:flex-row md:gap-12'}>
                <LabeledTextProposal label="Company Name" value={proposal.companyName} />
                <LabeledTextProposal label="Company Domain Name" value={proposal.companyDomain} />
                <LabeledTextProposal
                  label="Country of Incorporation"
                  value={proposal.companyCountry}
                />
              </div>
            </div>

            <div className={'flex w-full flex-col gap-6 overflow-x-hidden'}>
              <div className={'sun-text-20-md text-sun-header'}>
                Problem Statements & Proposal Benefits
              </div>
              <LabeledTextProposal label={'Abstract'} value={proposal.abstract} />
              <LabeledTextProposal label={'Motivation'} value={proposal.motivation} />
              <LabeledCopyId label="Government Action ID" id={proposal.govActionId} midEllips />
              <LabeledCopyId
                label="(CIP-129) Governance Action ID"
                id={proposal.cip129ActionId}
                midEllips
              />
              <LabeledTextProposal label={'Rationale'} value={proposal.rationale} />
            </div>
          </div>
        </div>
        <div
          className={
            'border-sun-border-primary flex w-full flex-col gap-4 rounded-2xl border p-6 md:min-w-100 lg:w-fit'
          }
        >
          <div
            className={
              'border-sun-border-primary sun-text-22-md text-sun-header flex border-b pb-4'
            }
          >
            Proposal Sponsors
          </div>
          {proposal.userPledged ? (
            <CardUserPledgeSimple
              fundProgress={completionPercentage}
              reqBudget={proposal.requestedBudget}
              userPledge={proposal.userPledged}
            />
          ) : null}
          <div className={'flex flex-col gap-2'}>
            {proposal.pledges.map((pledge) => (
              <CardProposalPledgeSingle
                key={pledge.id}
                pledgeAddr={pledge.id}
                handle={pledge.ownerName}
                reqBudget={proposal.requestedBudget}
                amount={pledge.amount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
    // TODO: handle loading state
    <div>No proposal found with id: {proposalId}</div>
  )
}
