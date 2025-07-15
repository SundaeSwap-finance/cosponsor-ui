import { FC } from 'react'
import { Button } from '@/components/shadcn/button'
import { InputIcon } from '@/components/input/InputIcon'
import { ArrowUpRight, ListFilter, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardProposal } from '@/components/proposals/CardProposal'
import { CarouselProposals } from '@/components/proposals/CarouselProposals'

export const PageProposalsAll: FC = () => {
  return (
    <div className={'flex w-full flex-col gap-8 overflow-y-auto'}>
      <div className={'sun-page-padding-r flex h-full w-full flex-col gap-6'}>
        <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
        <div
          className={
            'border-b-sun-border-secondary flex h-full w-full flex-row justify-between border-b pb-6'
          }
        >
          <div className={'flex flex-col gap-4'}>
            <h1 className={'text-sun-header sun-text-h2-md leading-12'}>All Proposals</h1>
            <div className={'sun-text-14-rg text-sun-default'}>Lorem ipsum</div>
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
        </div>
      </div>
      <CarouselProposals categoryName={'Hardfork'} />
      <CarouselProposals categoryName={'Treasury'} />
    </div>
  )
}
