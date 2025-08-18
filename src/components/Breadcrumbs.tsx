import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/shadcn/breadcrumb'
import { ChevronRight, PanelLeft } from 'lucide-react'

export type breadcrumbType = {
  name: string
  link: string
  active?: boolean
  ellipsis?: boolean
  hide?: boolean
}
export const Breadcrumbs = ({
  items,
  maxNameLength = 30,
}: {
  items: breadcrumbType[]
  maxNameLength?: number
}) => {
  return (
    <Breadcrumb className={'text-muted-foreground sun-text-14-rg'}>
      <BreadcrumbList className={'!gap-2'}>
        <PanelLeft className={'text-sun-sidebar-foreground size-4'} />
        <div className={'bg-sun-border-secondary h-4 w-[1px]'} />
        {items.map(
          (item, index) =>
            !item.hide && (
              <>
                {index != 0 && (
                  <BreadcrumbSeparator>
                    <ChevronRight />
                  </BreadcrumbSeparator>
                )}

                <BreadcrumbItem>
                  {item.active ? (
                    <BreadcrumbPage className={'text-sun-foreground'}>
                      {item.name.slice(0, maxNameLength) +
                        (item.name.length > maxNameLength ? '...' : '')}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.link}>
                      {item.name.length > maxNameLength || item.ellipsis ? (
                        <BreadcrumbEllipsis className={'size-4'} title={item.name} />
                      ) : (
                        item.name
                      )}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </>
            )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
