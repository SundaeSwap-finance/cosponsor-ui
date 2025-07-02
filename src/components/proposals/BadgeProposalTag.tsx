export const BadgeProposalTag = ({ tagName }: { tagName: string }) => {
  return (
    <div
      className={
        'bg-sun-secondary-default/10 border-sun-secondary-default/20 text-sun-secondary-default text-10-md h-fit rounded-sm border-1 px-2 py-0.5'
      }
    >
      {tagName}
    </div>
  )
}
