import React, { FC, useState, useEffect, useCallback } from 'react'

import { useGetProposalData } from '@/composables/useGetProposalData'
import { useParams } from 'react-router-dom'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { ListSimpleProposals } from '@/components/proposals/ListSimpleProposals'
import { IProposalCardData } from '@/types/Proposal'
import { LoaderCircle } from 'lucide-react'
import { TBreadcrumbType } from '@/components/Breadcrumbs'
import { Button } from '@/components/shadcn/button'

export const PageProposalsCategory: FC = () => {
  const { getCategoryProposalsPage } = useGetProposalData()
  const { name } = useParams()
  const [proposals, setProposals] = useState<IProposalCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextStart, setNextStart] = useState(0)

  const breadcrumbs: TBreadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: `All ${name} Proposals`, link: window.location.href, active: true },
  ]

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    setProposals([])
    getCategoryProposalsPage(name as string, 0, 20)
      .then((response) => {
        setProposals(response.proposals)
        setHasMore(response.hasMore)
        setNextStart(response.nextStart)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [name, getCategoryProposalsPage])

  // Load more handler
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return
    }
    setIsLoadingMore(true)
    try {
      const response = await getCategoryProposalsPage(name as string, nextStart, 20)
      setProposals((prev) => [...prev, ...response.proposals])
      setHasMore(response.hasMore)
      setNextStart(response.nextStart)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, nextStart, name, getCategoryProposalsPage])

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title={proposals.length > 0 || isLoading ? `All ${name} Proposals` : 'No Proposals found'}
        backButton={true}
        breadcrumbs={breadcrumbs}
      />
      {isLoading ? (
        <div className={'flex w-full justify-center'}>
          <LoaderCircle className={'size-8 animate-spin'} />
        </div>
      ) : (
        <>
          <ListSimpleProposals proposals={proposals} />
          {hasMore && (
            <div className={'flex w-full justify-center'}>
              <Button onClick={loadMore} disabled={isLoadingMore} variant="secondary">
                {isLoadingMore ? (
                  <>
                    <LoaderCircle className={'mr-2 size-4 animate-spin'} />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
