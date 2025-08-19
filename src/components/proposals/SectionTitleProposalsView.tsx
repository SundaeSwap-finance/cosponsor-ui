import { Button } from '@/components/shadcn/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ListFilter, Search } from 'lucide-react'
import { InputIcon } from '@/components/input/InputIcon'
import { Link } from 'react-router-dom'
import { ModalSearchProposals } from '@/components/modals/searchProposals/ModalSearchProposals'
import { useMemo } from 'react'
import { Breadcrumbs, breadcrumbType } from '@/components/Breadcrumbs'
import { ButtonProposalFilter } from '@/components/button/ButtonProposalFilter'

export const SectionTitleProposalsView = ({
  title,
  subtitle,
  backButton,
  breadcrumbs,
}: {
  title: string
  subtitle?: string
  backButton: boolean
  breadcrumbs?: breadcrumbType[]
}) => {
  return (
    <div className={'flex h-full w-full flex-col gap-6'}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

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
          <ButtonProposalFilter />
          <ModalSearchProposals
            modalTrigger={
              <Button variant="ghost" size="sm" className={'p-0 md:min-w-100'}>
                <div
                  className={
                    'border-sun-border-secondary flex w-full flex-row items-center gap-3 rounded-md border px-4 py-2'
                  }
                >
                  <Search className={'text-sun-header'} />
                  <div className={'text-sun-muted sun-text-12-rg'}>
                    Search proposal by title or dRep ID
                  </div>
                </div>
              </Button>
            }
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
