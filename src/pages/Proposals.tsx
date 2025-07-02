import { FC } from 'react'
import { Button } from '@/components/shadcn/button'
import { InputIcon } from '@/components/input/InputIcon'
import { Search } from 'lucide-react'

export const Proposals: FC = () => {
  return (
    <div className={'flex w-full flex-col gap-8 overflow-x-hidden overflow-y-auto'}>
      <div
        className={'border-b-sun-border-secondary flex w-full flex-col gap-6 border-b pr-32 pb-6'}
      >
        <div className={'text-muted-foreground text-14-rg'}>Breadcrumbs placeholder</div>
        <div className={'flex h-full w-full flex-row justify-between'}>
          <div className={'flex flex-col gap-4'}>
            <h1 className={'text-sun-header text-h2-md leading-12'}>Title placeholder</h1>
            <div className={'text-14-rg text-sun-default'}>Lorem ipsum</div>
          </div>
          <div className={'flex h-full w-fit flex-row items-end gap-2'}>
            <Button variant="outline">Filter</Button>
            <InputIcon
              icon={<Search className={'text-sun-header size-4'} />}
              iconPosition="left"
              type="text"
              placeholder="Search proposal by title or dRep ID"
              className={'w-100'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
