export const BadgeProposalPercent = ({
  percentage,
  isExpired,
}: {
  percentage: string
  isExpired?: boolean
}) => {
  return (
    <div
      className={
        'bg-sun-border-primary/20 border-sun-border-primary text-sun-other sun-text-12-md rounded-sm border-1 px-2 py-0.5'
      }
    >
      {isExpired ? 'EXPIRED' : percentage + '% Funded'}
    </div>
  )
}
