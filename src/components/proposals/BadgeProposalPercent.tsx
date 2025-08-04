import { cn } from '@/lib/utils'

export const BadgeProposalPercent = ({
  percentage,
  isExpired,
  className,
}: {
  percentage: string
  isExpired?: boolean
  className?: string
}) => {
  return (
    <div
      className={cn(
        'bg-sun-border-primary/20 border-sun-border-primary text-sun-other sun-text-12-md h-fit rounded-sm border-1 px-2 py-0.5',
        className
      )}
    >
      {isExpired ? 'EXPIRED' : percentage + '% Funded'}
    </div>
  )
}
