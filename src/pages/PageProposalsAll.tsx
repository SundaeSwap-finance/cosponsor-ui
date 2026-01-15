import { FC } from 'react'
import { CarouselProposals } from '@/components/proposals/CarouselProposals'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { TBreadcrumbType } from '@/components/Breadcrumbs'

export const PageProposalsAll: FC = () => {
  const breadcrumbs: TBreadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: 'All Proposals', link: '/all-proposals', active: true },
  ]

  return (
    <div className={'flex w-full flex-col gap-8 overflow-y-auto'}>
      <SectionTitleProposalsView
        title="All Proposals"
        backButton={false}
        subtitle="Lorem ipsum"
        breadcrumbs={breadcrumbs}
      />
      <CarouselProposals categoryName={'Info Action'} />
      <CarouselProposals categoryName={'Treasury Withdrawal'} />
      <CarouselProposals categoryName={'New Constitution'} />
      <CarouselProposals categoryName={'Hard Fork'} />
      <CarouselProposals categoryName={'No Confidence'} />
      <CarouselProposals categoryName={'Protocol Parameters'} />
      <CarouselProposals categoryName={'Constitutional Committee'} />
    </div>
  )
}
