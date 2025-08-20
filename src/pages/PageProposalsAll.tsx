import { FC } from 'react'
import { CarouselProposals } from '@/components/proposals/CarouselProposals'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { breadcrumbType } from '@/components/Breadcrumbs'

export const PageProposalsAll: FC = () => {
  const breadcrumbs: breadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: 'All Proposals', link: '/all', active: true },
  ]

  return (
    <div className={'flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title="All Proposals"
        backButton={false}
        subtitle="Lorem ipsum"
        breadcrumbs={breadcrumbs}
      />
      <CarouselProposals categoryName={'Confidence'} />
      <CarouselProposals categoryName={'Committee'} />
      <CarouselProposals categoryName={'Constitution'} />
      <CarouselProposals categoryName={'Hard fork'} />
      <CarouselProposals categoryName={'Protocol'} />
      <CarouselProposals categoryName={'Treasury'} />
      <CarouselProposals categoryName={'Info'} />
    </div>
  )
}
