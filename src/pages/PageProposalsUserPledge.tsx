import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'

export const PageProposalsUserPledge = () => {
  const { getProposalCardsUserPledge } = useGetProposalData()

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={'Your Pledges'}
        subtitle={'Track the status of your committed funds and potential returns.'}
        backButton={false}
      />
      <div className={'flex flex-row flex-wrap justify-center gap-2.5'}>
        {getProposalCardsUserPledge()?.map((item, index) => (
          <CardProposal key={item.id} proposal={item} />
        ))}
      </div>
    </div>
  )
}
