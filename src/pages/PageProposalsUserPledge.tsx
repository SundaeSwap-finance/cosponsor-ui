import { useGetProposalData } from '@/composables/useGetProposalData'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { useEffect, useState } from 'react'
import { IProposalCardData } from '@/types/Proposal'
import { LoaderCircle } from 'lucide-react'
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

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={'Your Pledges'}
        subtitle={'Track the status of your committed funds and potential returns.'}
        backButton={false}
        breadcrumbs={breadcrumbs}
      />
      {isLoading ? (
        <div className={'flex w-full justify-center'}>
          <LoaderCircle className={'size-8 animate-spin'} />
        </div>
      ) : (
        <ListSimpleProposals proposals={proposals} />
      )}
    </div>
  )
}
