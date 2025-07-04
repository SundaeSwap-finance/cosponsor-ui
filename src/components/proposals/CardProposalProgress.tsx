import { Progress } from '@/components/shadcn/progress'

export const CardProposalProgress = ({
  fundProgress,
  reqBudget,
}: {
  fundProgress: number | undefined
  reqBudget: number | undefined
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
        <div className={'flex w-full flex-col gap-0.5'}>
          <div className={'text-12-md text-sun-muted text-nowrap'}>Funding Progress</div>
          <div className={'text-20-sb text-sun-header text-nowrap'}>₳ {fundProgress}</div>
        </div>
        <div className={'flex w-full flex-col justify-end gap-0.5 text-right'}>
          <div className={'text-12-md text-sun-muted text-nowrap'}>Requested Budget</div>
          <div className={'text-14-sb text-sun-header text-nowrap'}>₳ {reqBudget}</div>
        </div>
      </div>
      <div className={'flex w-full flex-row items-center gap-2'}>
        <Progress
          value={calculatePercent()}
          className={'[&>div]:bg-sun-action-tertiary bg-sun-surface-muted [&>div]:rounded-full'}
        />
        <div
          className={
            'border-sun-border-primary text-sun-muted text-10-rg rounded-full border-1 px-2 py-0.5'
          }
        >
          {calculatePercent()}%
        </div>
      </div>
    </div>
  )
}
