import { FC, useMemo, useState } from 'react'
import { CarouselProposals } from '@/components/proposals/CarouselProposals'
import { SectionTitleProposalsView } from '@/components/proposals/SectionTitleProposalsView'
import { TBreadcrumbType } from '@/components/Breadcrumbs'
import { IProposalFilters } from '@/types/IProposalFilters'

// Maps short filter names (from FilterPropType) to full category names used in carousels
const FILTER_TO_CATEGORY: Record<string, string> = {
  Confidence: 'No Confidence',
  Committee: 'Constitutional Committee',
  Constitution: 'New Constitution',
  'Hard fork': 'Hard Fork',
  Protocol: 'Protocol Parameters',
  Treasury: 'Treasury Withdrawal',
  Info: 'Info Action',
}

const ALL_CATEGORIES = [
  'Info Action',
  'Treasury Withdrawal',
  'New Constitution',
  'Hard Fork',
  'No Confidence',
  'Protocol Parameters',
  'Constitutional Committee',
]

export const PageProposalsAll: FC = () => {
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [proposalFilters, setIProposalFilters] = useState<IProposalFilters>({})

  const breadcrumbs: TBreadcrumbType[] = [
    { name: 'Overview', link: '/' },
    { name: 'All Proposals', link: '/all-proposals', active: true },
  ]

  const visibleCategories = useMemo(() => {
    if (typeFilters.length === 0) {
      return ALL_CATEGORIES
    }
    const allowed = typeFilters.map((f) => FILTER_TO_CATEGORY[f]).filter(Boolean)
    return ALL_CATEGORIES.filter((cat) => allowed.includes(cat))
  }, [typeFilters])

  return (
    <div className={'flex w-full flex-col gap-6 overflow-y-auto'}>
      <SectionTitleProposalsView
        title="All Proposals"
        backButton={false}
        subtitle="Browse governance proposals and pledge ADA toward their on-chain deposit."
        breadcrumbs={breadcrumbs}
        onTypeFilter={setTypeFilters}
        onFiltersChange={setIProposalFilters}
      />
      {visibleCategories.map((category) => (
        <CarouselProposals key={category} categoryName={category} filters={proposalFilters} />
      ))}
    </div>
  )
}
