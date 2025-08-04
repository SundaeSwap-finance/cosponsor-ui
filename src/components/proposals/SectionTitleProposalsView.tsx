import { Button } from '@/components/shadcn/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ListFilter, Search } from 'lucide-react'
import { InputIcon } from '@/components/input/InputIcon'
import { Link } from 'react-router-dom'

export const SectionTitleProposalsView = ({
  title,
  subtitle,
  backButton,
}: {
  title: string
  subtitle?: string
  backButton: boolean
}) => {
  return (
    <div className={'flex h-full w-full flex-col gap-6'}>
      <div className={'text-muted-foreground sun-text-14-rg'}>Breadcrumbs placeholder</div>
      <div
        className={cn(
          'border-b-sun-border-secondary flex h-full w-full flex-col justify-between gap-4 border-b md:pb-6 lg:flex-row',
          'sun-page-padding-rb'
        )}
      >
        <div className={'flex flex-col gap-4'}>
          <h1 className={'text-sun-header sun-text-h2-md leading-12 capitalize'}>{title}</h1>
          <div className={'sun-text-14-rg text-sun-default'}>{subtitle}</div>
        </div>

        <div className={'flex w-full flex-col items-end gap-2 md:w-fit md:flex-row'}>
          <Button variant="outline" className={cn('!bg-sun-white-pure text-sun-header')}>
            <ListFilter />
            Filter
          </Button>
          <InputIcon
            icon={<Search className={'text-sun-header size-4'} />}
            iconPosition="left"
            type="text"
            placeholder="Search proposal by title or dRep ID"
            className={'!bg-sun-white-pure !placeholder-sun-muted w-full md:w-100'}
          />
        </div>
        <>
          {backButton && (
            <Button variant="secondary" size="lg" asChild className={'self-end'}>
              <Link to={'/all'}>
                <ChevronLeft />
                Back
              </Link>
            </Button>
          )}
        </>
      </div>
    </div>
  )
}
