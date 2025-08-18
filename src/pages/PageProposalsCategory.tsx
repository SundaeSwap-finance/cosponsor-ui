import { FC, useEffect, useMemo, useState } from 'react'

import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { useParams } from 'react-router-dom'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { iProposalCardData } from '@/types/Proposal'
import { LoaderCircle } from 'lucide-react'
import { breadcrumbType } from '@/components/Breadcrumbs'

export const PageProposalsCategory: FC = () => {
  const { getProposalCardsInCategory } = useGetProposalData()
  const { name } = useParams()
  const [proposals, setProposals] = useState<iProposalCardData[]>()
  const [isLoading, setIsLoading] = useState(true)
  const breadcrumbs: breadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: 'All ' + name + ' Proposals', link: window.location.href, active: true },
  ]

  useEffect(() => {
    setIsLoading(true)
    getProposalCardsInCategory(name as string)
      .then((response) => {
        setProposals(response)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [name])

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={proposals || isLoading ? `All ${name} Proposals` : 'No Proposals found'}
        backButton={true}
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
