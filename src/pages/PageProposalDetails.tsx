import { Link, useParams } from 'react-router-dom'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { useEffect, useMemo, useState } from 'react'
import { BadgeProposalCategory } from '@/components/proposals/BadgeProposalCategory'
import { getShortDate, getShortDateAndTime } from '@/composables/useDateTime'
import { ChevronLeft, LoaderCircle, Vote } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { LabeledCopyId } from '@/components/proposals/LabeledCopyId'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'
import { CardUserPledgeSimple } from '@/components/proposals/pageDetails/CardUserPledgeSimple'
import { CardProposalPledgeSingle } from '@/components/proposals/pageDetails/CardProposalPledgeSingle'
import { LabeledTextProposal } from '@/components/proposals/pageDetails/LabeledTextProposal'
import { BannerProposalExpired } from '@/components/proposals/pageDetails/BannerProposalExpired'
import { BannerProposalProgress } from '@/components/proposals/pageDetails/BannerProposalProgress'
import { ButtonSponsor } from '@/components/button/ButtonSponsor'
import { IProposalDetailsData } from '@/types/Proposal'
import { Breadcrumbs, TBreadcrumbType } from '@/components/Breadcrumbs'
import { useScreenSize } from '@/composables/useScreenSize'

export const PageProposalDetails = () => {
  const { getProposalDetailsById } = useGetProposalData()
  const { isLg, isMd } = useScreenSize()
  const twoDayMilliseconds = 60000 * 60 * 48
  const { proposalId } = useParams()
  const [proposal, setProposal] = useState<IProposalDetailsData>()
  const [isLoading, setIsLoading] = useState(false)
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
    // `pledgedAmount` is the chain-state aggregate across every UTxO at the
    // script address for this proposal — including the user's own deposits.
    // Don't add `userPledged` on top: that double-counts the user.
    if (proposal?.pledgedAmount) {
      return proposal.pledgedAmount
    }
    if (proposal?.pledges && proposal.pledges.length > 0) {
      return proposal.pledges.reduce((sum, p) => sum + (p?.amount ?? 0), 0)
    }
    return 0
  }, [proposal])

  const completionPercentage = useMemo((): number => {
    if (totalPledged && proposal?.cosponsorTarget) {
      return (totalPledged / proposal.cosponsorTarget) * 100
    }
    return 0
  }, [totalPledged, proposal?.cosponsorTarget])

  const expiryTitleTooltip = useMemo(() => {
    return `${(isExpired ? 'Expired on ' : 'Expires on ') + expiryDateTime} ${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    } time`
  }, [expiryDateTime, isExpired])

  const breadcrumbs = useMemo((): TBreadcrumbType[] => {
    if (isLoading) {
      return [
        { name: 'Overview', link: '/' },
        { name: 'All Proposals', link: '/all-proposals' },
      ]
    } else {
      const categoryLink = proposal?.categoryName.split(' ')[0].toLowerCase()
      return [
        { name: 'Overview', link: '/all-proposals', ellipsis: !isLg },
        { name: 'All Proposals', link: '/all-proposals' },
        {
          name: proposal?.categoryName ?? '',
          link: `/category/${categoryLink}`,
        },
        {
          name: proposal?.name ?? '',
          link: `/proposal/${proposalId}`,
          active: true,
          hide: !isMd,
        },
      ]
    }
  }, [isLoading, proposal?.categoryName, proposal?.name, isLg, isMd, proposalId])

  useEffect(() => {
    setIsLoading(true)
    getProposalDetailsById(proposalId as string).then((resultProp) => {
      setProposal(resultProp as IProposalDetailsData)
      setIsLoading(false)
    })
  }, [proposalId, getProposalDetailsById])

  useEffect(() => {
    if (!proposal || isExpired) {
      return
    }
    let timer: ReturnType<typeof setTimeout> | undefined

    const timeRemaining = proposal.expiryDate.getTime() - new Date().getTime()

    if (timeRemaining <= 0) {
      setIsExpired(true)
    } else if (timeRemaining < twoDayMilliseconds) {
      timer = setTimeout(() => {
        setIsExpired(true)
      }, timeRemaining)
    }

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal, isExpired])

  return isLoading || !proposal ? (
    <div className={'flex h-[492px] w-full items-center justify-center'}>
      <LoaderCircle className={'size-8 animate-spin'} />
    </div>
  ) : (
    <div className={'sun-page-padding-rb flex h-full w-full flex-col gap-8'}>
      <Breadcrumbs items={breadcrumbs} />
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
            <div
              className={'text-sun-muted underline decoration-dotted underline-offset-4'}
              title={`UserId: ${proposal.ownerId}`}
            >
              {proposal.ownerName}
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
            <Link to={'/all-proposals'}>
              <ChevronLeft />
              Back
            </Link>
          </Button>
          {!isExpired && (
            <ButtonSponsor
              classButton={'h-12 !px-5 lg:flex-1 sun-text-16-rg'}
              proposalId={proposal.id}
              proposal={proposal}
              content={
                <>
                  <Vote />
                  Sponsor this proposal
                </>
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
                cosponsorTarget={proposal.cosponsorTarget}
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
              <LabeledCopyId label="Governance Action ID" id={proposal.govActionId} midEllips />
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
              cosponsorTarget={proposal.cosponsorTarget}
              userPledge={proposal.userPledged}
              proposal={proposal}
            />
          ) : null}
          <div className={'flex flex-col gap-2'}>
            {proposal.pledges.map((pledge) => (
              <CardProposalPledgeSingle
                key={pledge.id}
                pledgeAddr={pledge.id}
                handle={pledge.ownerName}
                cosponsorTarget={proposal.cosponsorTarget ?? 0}
                amount={pledge.amount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
