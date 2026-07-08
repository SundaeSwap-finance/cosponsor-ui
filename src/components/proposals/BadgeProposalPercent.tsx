import { cn } from '@/lib/utils'

export const BadgeProposalPercent = ({
  percentage,
  isExpired,
  isSubmitted,
  className,
}: {
  percentage: string
  isExpired?: boolean
  isSubmitted?: boolean
  className?: string
}) => {
  // Handle 'n/a' or invalid percentages for on-chain proposals without budget data.
  // Submitted wins over the percentage: the propose tx consumed the pool, so
  // the chain-state total reads 0% even though the action is live on-chain.
  const displayText = isSubmitted
    ? 'Submitted'
    : isExpired
      ? 'EXPIRED'
      : percentage === 'n/a'
        ? 'On-chain'
        : `${percentage}% Funded`

  return (
    <div
      className={cn(
        'bg-sun-border-primary/20 border-sun-border-primary text-sun-other sun-text-12-md h-fit rounded-sm border-1 px-2 py-0.5',
        className
      )}
    >
      {displayText}
    </div>
  )
}
