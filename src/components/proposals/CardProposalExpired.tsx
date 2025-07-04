export const CardProposalExpired = ({ userPledge }: { userPledge: number | undefined }) => {
  return (
    <div
      className={
        'border-sun-action-tertiary/20 bg-sun-action-tertiary/10 flex flex-col gap-1 rounded-lg border p-4'
      }
    >
      <div className={'text-sun-action-tertiary text-16-sb'}>Proposal Unfunded</div>
      <div className={'text-12-md text-sun-action-tertiary'}>
        This proposal’s governance action has expired without reaching its funding target. Redeem
        your <b>{userPledge?.toFixed(2)} ADA</b> by depositing your <b>gADA.</b>
      </div>
    </div>
  )
}
