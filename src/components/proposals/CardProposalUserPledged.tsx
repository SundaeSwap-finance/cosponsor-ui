import { Progress } from '@/components/shadcn/progress'
import { ProgressMulti } from '@/components/graphics/ProgressMulti'

export const CardProposalUserPledged = ({
  fundProgress,
  reqBudget,
  userPledge,
}: {
  fundProgress: number | undefined
  reqBudget: number | undefined
  userPledge: number | undefined
}) => {
  const calculateNonUserPercent = () => {
    if (fundProgress && reqBudget && userPledge) {
      return Math.round(((fundProgress - userPledge) / reqBudget) * 100)
    }
    return -1
  }

  const calcUserPercent = () => {
    if (userPledge && reqBudget) {
      return Math.round((userPledge / reqBudget) * 100)
    }
    return -1
  }
  const calcTotalPercent = () => {
    if (fundProgress && reqBudget) {
      return (fundProgress / reqBudget) * 100
    }
    return -1
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-2 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between'}>
        <div className={'flex w-fit flex-col gap-0.5'}>
          <div className={'sun-text-12-md text-nowrap'}>Funding Progress</div>
          <div className={'sun-text-20-sb text-sun-header text-nowrap'}>₳ {fundProgress}</div>
        </div>
        <div className={'flex w-full flex-col justify-end gap-0.5 text-right'}>
          <div className={'sun-text-12-md text-sun-muted text-nowrap'}>Requested Budget</div>
          <div className={'sun-text-14-sb text-sun-header text-nowrap'}>₳ {reqBudget}</div>
        </div>
      </div>
      <div className={'flex w-full flex-row items-center gap-2'}>
        <ProgressMulti
          segments={[
            { colorClass: 'bg-sun-action-primary', value: calculateNonUserPercent() },
            {
              colorClass:
                ' bg-gradient-to-l to-sun-highlight-secondary from-sun-highlight-primary ',
              value: calcUserPercent(),
            },
          ]}
        />
        <div
          className={
            'border-sun-border-primary text-sun-muted sun-text-10-rg rounded-full border-1 px-2 py-0.5'
          }
        >
          {calcTotalPercent().toPrecision(4)}%
        </div>
      </div>
      <div className={'flex w-full flex-row items-center justify-between'}>
        <div
          className={
            'to-sun-highlight-secondary from-sun-highlight-primary sun-text-12-sb bg-gradient-to-r bg-clip-text text-transparent'
          }
        >
          Your Pledge
        </div>
        <div className={'flex w-fit flex-row gap-2'}>
          <div
            className={
              'to-sun-highlight-secondary/20 from-sun-highlight-primary/20 relative inline-block h-fit rounded-full bg-linear-to-r p-[0.75px]'
            }
          >
            <div
              className={
                'sun-text-10-sb bg-sun-white-pure/50 h-full w-full rounded-full px-2 py-0.5'
              }
            >
              <div
                className={
                  'to-sun-highlight-secondary from-sun-highlight-primary bg-gradient-to-r bg-clip-text text-transparent'
                }
              >
                {calcUserPercent().toPrecision(3)}%
              </div>
            </div>
          </div>
          <div
            className={
              'to-sun-highlight-secondary from-sun-highlight-primary sun-text-14-sb bg-gradient-to-r bg-clip-text text-transparent'
            }
          >
            ₳ {userPledge}
          </div>
        </div>
      </div>
    </div>
  )
}
