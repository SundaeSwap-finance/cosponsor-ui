import { useCallback, useEffect, useState } from 'react'
import { CardProposal } from '@/components/proposals/CardProposal'
import { Button } from '@/components/shadcn/button'
import { ArrowUpRight, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/shadcn/carousel'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { iProposalCardData } from '@/types/Proposal'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export const CarouselProposals = ({ categoryName }: { categoryName: string }) => {
  // TODO replace this with filtered items
  const { getProposalCardsInCategory, doesCategoryHaveProposals } = useGetProposalData()
  const [proposals, setProposals] = useState<iProposalCardData[]>()
  const [hasProposals, setHasProposals] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [api, setApi] = useState<CarouselApi>()

  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(api?.canScrollPrev() ?? true)
  const [canScrollNext, setCanScrollNext] = useState<boolean>(api?.canScrollNext() ?? true)

  useEffect(() => {
    setIsLoading(true)
    getProposalCardsInCategory(categoryName)
      .then((response) => {
        setProposals(response)
      })
      .finally(() => {
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName])

  useEffect(() => {
    doesCategoryHaveProposals(categoryName).then((response) => {
      setHasProposals(response)
    })
  }, [categoryName])

  const clickNext = useCallback(() => {
    if (!api) {
      return
    }
    api.scrollNext()
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [api])

  const clickPrev = useCallback(() => {
    if (!api) {
      return
    }
    api.scrollPrev()
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [api])

  const getCategoryLink = () => {
    return `/category/${encodeURIComponent(categoryName.toLowerCase())}`
  }

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
              disabled={!api?.canScrollPrev()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              onClick={clickNext}
              className={'size-8 rounded-full p-0'}
              disabled={!api?.canScrollNext()}
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
              setApi={setApi}
              className={'w-full'}
              opts={{
                align: 'start',
                loop: true,
              }}
            >
              {/* Slide spacing is done with negative ml on content and positive pl on item, according to docs.*/}
              <CarouselContent className={'-ml-2'}>
                {proposals?.map((item, index) => (
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
