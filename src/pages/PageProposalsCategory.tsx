import { FC, useEffect, useState } from 'react'
import { Button } from '@/components/shadcn/button'
import { InputIcon } from '@/components/input/InputIcon'
import { ChevronLeft, ListFilter, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardProposal } from '@/components/proposals/CardProposal'
import { useGetProposalData } from '@/composables/useGetProposalData'
import { iProposalCardData } from '@/types/Proposal'
import { Link, useParams } from 'react-router-dom'

export const PageProposalsCategory: FC = () => {
  const { getProposalCardsInCategory } = useGetProposalData()
  const [proposals, setProposals] = useState<iProposalCardData[]>()
  const { name } = useParams()

  useEffect(() => {
    const foundProposals = getProposalCardsInCategory(name as string)
    if (!foundProposals || foundProposals.length < 1) {
      console.warn('No proposals found for this category')
      return
    }
    // console.log('ProposalCategory found: ', foundProposals)
    setProposals(foundProposals)
  }, [name])

  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <div className={'flex h-full w-full flex-col gap-6'}>
        <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
        <div
          className={
            'border-b-sun-border-secondary flex h-full w-full flex-row justify-between border-b pb-6'
          }
        >
          <div className={'flex flex-col gap-4'}>
            <h1 className={'text-sun-header sun-text-h2-md leading-12 capitalize'}>
              {proposals ? `All ${name} Proposals` : 'No Proposals found'}
            </h1>
          </div>
          <div className={'flex w-fit flex-row items-end gap-2'}>
            <Button variant="outline" className={cn('!bg-sun-white-pure text-sun-header')}>
              <ListFilter />
              Filter
            </Button>
            <InputIcon
              icon={<Search className={'text-sun-header size-4'} />}
              iconPosition="left"
              type="text"
              placeholder="Search proposal by title or dRep ID"
              className={'!bg-sun-white-pure !placeholder-sun-muted w-100'}
            />
          </div>
          <Button variant="secondary" size="lg" asChild className={'self-end'}>
            <Link to={'/overview'}>
              <ChevronLeft />
              Back
            </Link>
          </Button>
        </div>
      </div>
      <div className={'flex flex-row flex-wrap justify-center gap-2.5'}>
        {proposals?.map((item, index) => (
          <CardProposal key={item.id} proposal={item} />
        ))}
      </div>
    </div>
  )
}
