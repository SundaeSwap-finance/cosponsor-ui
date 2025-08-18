import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { useEffect, useState } from 'react'
import { iProposalCardData } from '@/types/Proposal'
import { LoaderCircle } from 'lucide-react'

export const PageProposalsUserPledge = () => {
  const { getProposalCardsUserPledge } = useGetProposalData()
  const [proposals, setProposals] = useState<iProposalCardData[]>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getProposalCardsUserPledge()
      .then((response) => {
        setProposals(response)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={'Your Pledges'}
        subtitle={'Track the status of your committed funds and potential returns.'}
        backButton={false}
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
