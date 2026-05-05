export const LabeledTextProposal = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className={'flex flex-col gap-1'}>
      <div className={'sun-text-12-md text-sun-muted leading-5'}>{label}</div>
      <div className={'sun-text-16-md text-sun-default leading-5'}>{value}</div>
    </div>
  )
}
