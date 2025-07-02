export const BadgeProposalPercent = ({ percentage }: { percentage: number }) => {
  return (
    <div
      className={
        'bg-sun-border-primary/20 border-sun-border-primary text-sun-other text-12-md rounded-sm border-1 px-2 py-0.5'
      }
    >
      {percentage}% Funded
    </div>
  )
}
