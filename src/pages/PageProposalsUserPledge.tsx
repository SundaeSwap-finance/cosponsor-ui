import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'

export const PageProposalsUserPledge = () => {
  const { getProposalCardsUserPledge } = useGetProposalData()

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={'Your Pledges'}
        subtitle={'Track the status of your committed funds and potential returns.'}
        backButton={false}
      />
      <ListSimpleProposals proposals={getProposalCardsUserPledge()} />
    </div>
  )
}
