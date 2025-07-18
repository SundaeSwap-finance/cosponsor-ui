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

export const PageProposalDetails = () => {
  const { proposalId } = useParams()
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const { getProposalDetailsById } = useGetProposalData()

  const proposal = useMemo(() => {
    const foundProposal = getProposalDetailsById(proposalId as string)
    if (!foundProposal) {
      console.warn('No proposal found for this id')
      return
    }
    return foundProposal
  }, [])

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

  const initDate = useMemo(() => getShortDate(proposal?.initDate), [proposal?.initDate])
  const expiryDate = useMemo(() => getShortDate(proposal?.expiryDate), [proposal?.expiryDate])
  const expiryDateTime = useMemo(
    () => getShortDateAndTime(proposal?.expiryDate),
    [proposal?.expiryDate]
  )

  const completionPercentage = useMemo((): number => {
    if (proposal?.pledgedAmount && proposal?.requestedBudget) {
      return (proposal?.pledgedAmount / proposal?.requestedBudget) * 100
    }
    return -1
  }, [proposal?.pledgedAmount, proposal?.requestedBudget])

  const LabeledText = ({ label, value }: { label: string; value: string }) => {
    return (
      <div className={'flex flex-col gap-1'}>
        <div className={'sun-text-12-md text-sun-muted leading-5'}>{label}</div>
        <div className={'sun-text-16-md text-sun-default leading-5'}>{value}</div>
      </div>
    )
  }
  const expiryTitleTooltip = useMemo(() => {
    return (
      (isExpired ? 'Expired on ' : 'Expires on ') +
      expiryDateTime +
      ' ' +
      Intl.DateTimeFormat().resolvedOptions().timeZone +
      ' time'
    )
  }, [expiryDateTime, isExpired])

  return (
    proposal && (
      <div className={'sun-page-padding-rb flex h-full w-full flex-col gap-8'}>
        <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
        <div
          className={
            'border-b-sun-border-secondary flex h-full w-full flex-col justify-between gap-4 border-b pb-6 md:flex-row'
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
            <Button variant="secondary" size="lg" asChild>
              <Link to={'/all'}>
                <ChevronLeft />
                Back
              </Link>
            </Button>
            {isExpired ? null : (
              <ButtonGradient className={'flex-1'} size="lg">
                <Vote />
                Sponsor this proposal
              </ButtonGradient>
            )}
          </div>
        </div>
        <div className={'flex flex-col gap-12 lg:flex-row'}>
          <div className={'flex w-full flex-col gap-6'}>
            <>
              {isExpired ? (
                <div
                  className={
                    'border-sun-action-tertiary/20 bg-sun-action-tertiary/10 flex flex-col gap-4 rounded-lg border p-6'
                  }
                >
                  <div className={'flex flex-col gap-2'}>
                    <div className={'text-sun-action-tertiary sun-text-20-sb leading-5'}>
                      Proposal Unfunded – Please Withdraw Your Pledge
                    </div>
                    <div className={'sun-text-16-md text-sun-action-tertiary'}>
                      This proposal’s governance action has expired without reaching its funding
                      target. <br />
                      Redeem your <b>{proposal.userPledged?.toFixed(2)} ADA</b> by depositing your{' '}
                      <b>gADA.</b>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className={
                      'bg-sun-action-tertiary text-sun-white-pure sun-text-16-rg hover:bg-sun-action-tertiary/80 w-fit'
                    }
                  >
                    <ArrowUpFromLine />
                    Withdraw Pledge
                  </Button>
                </div>
              ) : (
                <div className={'flex flex-col gap-4'}>
                  <div className={'flex flex-row items-center justify-between'}>
                    <div className={'sun-text-22-md text-sun-header'}>
                      {completionPercentage.toPrecision(4)}% sponsored
                    </div>
                    <div className={'flex flex-row items-end'}>
                      <div className={'sun-text-22-md text-sun-header'}>
                        ₳{proposal.pledgedAmount.toFixed(2)}
                      </div>
                      <div className={'sun-text-18-md text-sun-muted'}>
                        /₳{proposal.requestedBudget.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <ProgressMilestones
                    value={completionPercentage}
                    milestones={[0, 25, 50, 75, 100]}
                  />
                </div>
              )}
            </>
            <div className={'bg-sun-border-primary h-[1px] w-full'} />
            <div className={'flex flex-col gap-12'}>
              <div className={'flex flex-col gap-6'}>
                <div className={'sun-text-20-md text-sun-header leading-5'}>Proposal Ownership</div>
                <div className={'flex flex-col gap-3 md:flex-row md:gap-12'}>
                  <LabeledText label="Company Name" value={proposal.companyName} />
                  <LabeledText label="Company Domain Name" value={proposal.companyDomain} />
                  <LabeledText label="Country of Incorporation" value={proposal.companyCountry} />
                </div>
              </div>

              <div className={'flex w-full flex-col gap-6 overflow-x-hidden'}>
                <div className={'sun-text-20-md text-sun-header'}>
                  Problem Statements & Proposal Benefits
                </div>
                <LabeledText label={'Abstract'} value={proposal.abstract} />
                <LabeledText label={'Motivation'} value={proposal.motivation} />
                <LabeledCopyId label="Government Action ID" id={proposal.govActionId} />
                <LabeledCopyId
                  label="(CIP-129) Governance Action ID"
                  id={proposal.cip129ActionId}
                />
                <LabeledText label={'Rationale'} value={proposal.rationale} />
              </div>
            </div>
          </div>
          <div
            className={
              'border-sun-border-primary flex w-fit min-w-75 flex-col gap-3 rounded-2xl border p-6'
            }
          >
            <div
              className={
                'border-sun-border-primary sun-text-22-md text-sun-header flex border-b pb-4'
              }
            >
              Proposal Sponsors
            </div>
            <div className={'flex flex-col gap-2'}></div>
          </div>
        </div>
      </div>
    )
  )
}
