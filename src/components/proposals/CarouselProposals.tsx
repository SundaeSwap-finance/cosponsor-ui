import { useCallback, useEffect, useState } from 'react'
import { CardProposal } from '@/components/proposals/CardProposal'
import { Button } from '@/components/shadcn/button'
import { ArrowUpRight, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/shadcn/carousel'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { IProposalCardData } from '@/types/Proposal'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export const CarouselProposals = ({ categoryName }: { categoryName: string }) => {
  const { getCategoryProposalsPage } = useGetProposalData()
  const [proposals, setProposals] = useState<IProposalCardData[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nextStart, setNextStart] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  // Initial load - fetch first page only
  useEffect(() => {
    setIsLoading(true)
    setProposals([])
    getCategoryProposalsPage(categoryName, 0, 10)
      .then((response) => {
        setProposals(response.proposals)
        setHasMore(response.hasMore)
        setNextStart(response.nextStart)
      })
      .finally(() => {
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName])

  // Load more when scrolling near end
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return
    }
    setIsLoadingMore(true)
    try {
      const response = await getCategoryProposalsPage(categoryName, nextStart, 10)
      setProposals((prev) => [...prev, ...response.proposals])
      setHasMore(response.hasMore)
      setNextStart(response.nextStart)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, nextStart, categoryName, getCategoryProposalsPage])

  // Auto-load more when carousel reaches end
  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const onSelect = () => {
      // If near the end, load more
      if (carouselApi.canScrollNext() === false && hasMore) {
        loadMore()
      }
    }

    carouselApi.on('select', onSelect)
    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi, hasMore, loadMore])

  const clickNext = useCallback(() => {
    if (!carouselApi) {
      return
    }
    carouselApi.scrollNext()
  }, [carouselApi])

  const clickPrev = useCallback(() => {
    if (!carouselApi) {
      return
    }
    carouselApi.scrollPrev()
  }, [carouselApi])

  const getCategoryLink = () => {
    return `/category/${encodeURIComponent(categoryName.toLowerCase())}`
  }

  // Don't render if no proposals and not loading
  const hasProposals = proposals.length > 0 || isLoading

  return (
    hasProposals && (
      <div className={'flex w-full flex-col gap-4.5'}>
        <div className={'sun-page-padding-r flex flex-row items-center justify-between'}>
          <div className={categoryName ? 'hidden' : 'flex'} />
          <div className={categoryName ? 'flex flex-row items-center gap-6' : 'hidden'}>
            <h2 className={'sun-text-24-md text-sun-header'}>{categoryName}</h2>
            <Button variant="secondary" size="sm" asChild>
              <Link to={getCategoryLink()} className={'sun-text-12-md'}>
                See All
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <div className={'flex flex-row gap-2'}>
            <Button
              variant="secondary"
              onClick={clickPrev}
              className={'size-8 rounded-full p-0'}
              disabled={!carouselApi?.canScrollPrev()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              onClick={clickNext}
              className={'size-8 rounded-full p-0'}
              disabled={!carouselApi?.canScrollNext()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className={'relative w-full overflow-x-hidden'}>
          {isLoading ? (
            <div className={'flex h-[492px] w-full items-center justify-center'}>
              <LoaderCircle className={'size-8 animate-spin'} />
            </div>
          ) : (
            <Carousel
              setApi={setCarouselApi}
              className={'w-full'}
              opts={{
                align: 'start',
                loop: true,
              }}
            >
              {/* Slide spacing is done with negative ml on content and positive pl on item, according to docs.*/}
              <CarouselContent className={'-ml-2'}>
                {proposals?.map((item, _index) => (
                  <CarouselItem key={item.id} className={'basis-auto p-0 pl-2'}>
                    <CardProposal proposal={item} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
          <div
            className={cn(
              'from-sun-white-pure pointer-events-none absolute top-0 right-0 bottom-0 hidden',
              'w-32 bg-gradient-to-l to-transparent md:flex'
            )}
          />
        </div>
      </div>
    )
  )
}
