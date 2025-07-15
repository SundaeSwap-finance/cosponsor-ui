import { useCallback, useEffect, useState } from 'react'
import { CardProposal } from '@/components/proposals/CardProposal'
import { Button } from '@/components/shadcn/button'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
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

export const CarouselProposals = ({ categoryName }: { categoryName: string }) => {
  // TODO replace this with filtered items
  const { getProposalCardsInCategory } = useGetProposalData()
  const [proposals, setProposals] = useState<iProposalCardData[]>()
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    setProposals(getProposalCardsInCategory(categoryName))
  }, [categoryName])

  const clickNext = useCallback(() => {
    if (!api) {
      return
    }
    api.scrollNext()
  }, [api])

  const clickPrev = useCallback(() => {
    if (!api) {
      return
    }
    api.scrollPrev()
  }, [api])

  const getCategoryLink = () => {
    return `/category/${encodeURIComponent(categoryName.toLowerCase())}`
  }

  return (
    <div className={'flex w-full flex-col gap-4.5'}>
      <div className={'sun-page-padding-r flex flex-row items-center justify-between'}>
        <div className={categoryName ? 'hidden' : 'flex'} />
        <div className={categoryName ? 'flex flex-row items-center gap-6' : 'hidden'}>
          <h2 className={'sun-text-24-md'}>{categoryName}</h2>
          <Button variant="secondary" asChild>
            <Link to={getCategoryLink()}>
              See All
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className={'flex flex-row gap-2'}>
          <Button variant="secondary" size="icon" onClick={clickPrev} className={'rounded-full'}>
            <ChevronLeft />
          </Button>
          <Button variant="secondary" size="icon" onClick={clickNext} className={'rounded-full'}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className={'relative w-full overflow-x-hidden'}>
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
              <CarouselItem key={item.id} className={'basis-110 pl-2'}>
                <CardProposal proposal={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="from-sun-white-pure pointer-events-none absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l to-transparent" />
      </div>
    </div>
  )
}
