import { FC } from 'react'
import { CarouselProposals } from '@/components/proposals/CarouselProposals'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'

export const PageProposalsAll: FC = () => {
  return (
    <div className={'flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView title="All Proposals" backButton={false} subtitle="Lorem ipsum" />
      <CarouselProposals categoryName={'Confidence'} />
      <CarouselProposals categoryName={'Committee'} />
      <CarouselProposals categoryName={'Constitution'} />
      <CarouselProposals categoryName={'Hardfork'} />
      <CarouselProposals categoryName={'Protocol'} />
      <CarouselProposals categoryName={'Treasury'} />
      <CarouselProposals categoryName={'Info'} />
    </div>
  )
}
