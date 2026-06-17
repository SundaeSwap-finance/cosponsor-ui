import { useGetProposalData } from '@/composables/useGetProposalData'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { type ReactNode, useEffect, useState } from 'react'
import { IProposalCardData } from '@/types/Proposal'
import { Inbox, LoaderCircle, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TBreadcrumbType } from '@/components/Breadcrumbs'
import { useWalletObserver } from '@sundaeswap/wallet-lite'

export const PageProposalsUserPledge = () => {
  const { getProposalCardsUserPledge } = useGetProposalData()
  const walletHook = useWalletObserver()
  const walletObserver = walletHook.observer
  const [proposals, setProposals] = useState<IProposalCardData[]>()
  const [isLoading, setIsLoading] = useState(true)
  const breadcrumbs: TBreadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: 'Your Pledges', link: '/your-pledges', active: true },
  ]

  const isWalletConnected = !!walletObserver.api

  // Refresh data when wallet connection state changes
  useEffect(() => {
    setIsLoading(true)
    getProposalCardsUserPledge()
      .then((response) => {
        setProposals(response)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [getProposalCardsUserPledge, walletObserver.api])

  const isEmpty = !proposals || proposals.length === 0

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className={'flex w-full justify-center'}>
          <LoaderCircle className={'size-8 animate-spin'} />
        </div>
      )
    }

    if (isEmpty) {
      return !isWalletConnected ? (
        <EmptyState
          icon={<Wallet className={'size-8'} />}
          title={'Connect a wallet to track your pledges'}
          description={
            'Use the "Connect A Wallet" button to see the proposals you’ve pledged to and withdraw anytime.'
          }
        />
      ) : (
        <EmptyState
          icon={<Inbox className={'size-8'} />}
          title={'No pledges yet'}
          description={'You haven’t pledged to any proposals yet.'}
          action={
            <Link
              to={'/all-proposals'}
              className={
                'bg-sun-surface-muted text-sun-header sun-text-12-md hover:bg-sun-border-primary rounded-lg px-4 py-2 transition-colors'
              }
            >
              Browse proposals
            </Link>
          }
        />
      )
    }

    return <ListSimpleProposals proposals={proposals} />
  }

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={'Your Pledges'}
        subtitle={'Track the status of your committed funds and potential returns.'}
        backButton={false}
        breadcrumbs={breadcrumbs}
      />
      {renderBody()}
    </div>
  )
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) => {
  return (
    <div className={'flex w-full flex-col items-center gap-3 py-16 text-center'}>
      <div className={'text-sun-disabled'}>{icon}</div>
      <div className={'sun-text-16-md text-sun-header'}>{title}</div>
      <div className={'sun-text-14-rg text-sun-default max-w-100'}>{description}</div>
      {action ? <div className={'mt-2'}>{action}</div> : null}
    </div>
  )
}
