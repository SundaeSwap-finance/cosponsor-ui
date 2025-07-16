import { FC, useMemo } from 'react'

import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { useParams } from 'react-router-dom'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'

export const PageProposalsCategory: FC = () => {
  const { getProposalCardsInCategory } = useGetProposalData()
  const { name } = useParams()

  const proposals = useMemo(() => {
    const foundProposals = getProposalCardsInCategory(name as string)
    if (!foundProposals || foundProposals.length < 1) {
      console.warn('No proposals found for this category')
      return
    }
    return foundProposals
  }, [])

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={proposals ? `All ${name} Proposals` : 'No Proposals found'}
        backButton={true}
      />
      <div className={'flex flex-row flex-wrap justify-center gap-2.5'}>
        {proposals?.map((item, index) => (
          <CardProposal key={item.id} proposal={item} />
        ))}
      </div>
    </div>
  )
}
