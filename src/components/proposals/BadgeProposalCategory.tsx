import { cn } from '@/lib/utils'

export const BadgeProposalCategory = ({
  category,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { category: string }) => {
  return (
    <div
      className={cn(
        'bg-sun-highlight-primary/10 border-sun-highlight-primary/20 text-sun-highlight-primary sun-text-10-md h-fit rounded-sm border-1 px-2 py-0.5',
        props.className
      )}
    >
      {category}
    </div>
  )
}
