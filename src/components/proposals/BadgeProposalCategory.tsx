import { cn } from '@/lib/utils'

export const BadgeProposalCategory = ({
  category,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { category: string }) => {
  return (
    <div
      className={cn(
        'bg-sun-secondary-default/10 border-sun-secondary-default/20 text-sun-secondary-default sun-text-10-md h-fit rounded-sm border-1 px-2 py-0.5',
        props.className
      )}
    >
      {category}
    </div>
  )
}
