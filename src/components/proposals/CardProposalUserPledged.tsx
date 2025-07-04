import { Progress } from '@/components/shadcn/progress'

export const CardProposalUserPledged = ({
  fundProgress,
  reqBudget,
  userPledge,
}: {
  fundProgress: number | undefined
  reqBudget: number | undefined
  userPledge: number | undefined
}) => {
  const calculatePercent = () => {
    if (fundProgress && reqBudget) {
      return Math.round((fundProgress / reqBudget) * 100)
    }
    return -1
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-2 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between'}>
        <div
          className={
            'to-sun-highlight-secondary from-sun-highlight-primary flex w-fit flex-col gap-0.5 bg-gradient-to-r bg-clip-text text-transparent'
          }
        >
          <div className={'text-12-md text-nowrap'}>Your Pledge</div>
          <div className={'text-20-sb text-nowrap'}>₳ {userPledge}</div>
        </div>
        <div className={'flex w-full flex-col justify-end gap-0.5 text-right'}>
          <div className={'text-12-md text-sun-muted text-nowrap'}>Requested Budget</div>
          <div className={'text-14-sb text-sun-header text-nowrap'}>₳ {reqBudget}</div>
        </div>
      </div>
      <div className={'flex w-full flex-row items-center gap-2'}>
        <Progress
          value={calculatePercent()}
          className={`[&>div]:from-sun-highlight-secondary [&>div]:to-sun-highlight-primary bg-sun-surface-muted [&>div]:rounded-full [&>div]:bg-gradient-to-r`}
        />
        <div
          className={
            'to-sun-highlight-secondary/20 from-sun-highlight-primary/20 relative inline-block rounded-full bg-linear-to-r p-[0.75px]'
          }
        >
          <div className={'text-10-md bg-sun-white-pure/50 h-full w-full rounded-full px-2 py-0.5'}>
            <div
              className={
                'to-sun-highlight-secondary from-sun-highlight-primary bg-gradient-to-r bg-clip-text text-transparent'
              }
            >
              {calculatePercent().toPrecision(4)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
