import React, { FC, useState, useEffect } from 'react'

import { useGetProposalData } from '@/composables/useGetProposalData'
import { useParams } from 'react-router-dom'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { IProposalCardData } from '@/types/Proposal'
import { LoaderCircle } from 'lucide-react'
import { TBreadcrumbType } from '@/components/Breadcrumbs'

export const PageProposalsCategory: FC = () => {
  const { getProposalCardsInCategory } = useGetProposalData()
  const { name } = useParams()
  const [proposals, setProposals] = useState<IProposalCardData[]>()
  const [isLoading, setIsLoading] = useState(true)
  const breadcrumbs: TBreadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: `All ${name} Proposals`, link: window.location.href, active: true },
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
  }, [name, getProposalCardsInCategory])

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
