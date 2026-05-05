import { maxDecimalsAda } from '@/config/config'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { ProgressMulti } from '@/components/graphics/ProgressMulti'

export const CardProposalUserPledged = ({
  reqBudget,
  userPledge,
}: {
  reqBudget: number
  userPledge: number | undefined
}) => {
  const { formatNumber } = useNumberFormatter()

  // If reqBudget is 0 or undefined, we don't have proposal budget data (on-chain only)
  const hasBudgetData = reqBudget && reqBudget > 0

  const calcUserPercent = () => {
    if (userPledge && hasBudgetData) {
      return Math.round((userPledge / reqBudget) * 100)
    }
    return -1
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-2 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between'}>
        <div className={'flex w-fit flex-col gap-0.5'}>
          <div
            className={
              'to-sun-highlight-secondary from-sun-highlight-primary sun-text-12-sb bg-gradient-to-r bg-clip-text text-transparent'
            }
          >
            Your Pledge
          </div>
          <div
            className={
              'to-sun-highlight-secondary from-sun-highlight-primary sun-text-20-sb bg-gradient-to-r bg-clip-text text-transparent'
            }
          >
            ₳{formatNumber(userPledge ?? 0, maxDecimalsAda)}
          </div>
        </div>
        {hasBudgetData && (
          <div className={'flex w-full flex-col justify-end gap-0.5 text-right'}>
            <div className={'sun-text-12-md text-sun-muted text-nowrap'}>Requested Budget</div>
            <div className={'sun-text-14-sb text-sun-header text-nowrap'}>
              ₳{formatNumber(reqBudget, maxDecimalsAda)}
            </div>
          </div>
        )}
      </div>
      {hasBudgetData && (
        <div className={'flex w-full flex-row items-center gap-2'}>
          <ProgressMulti
            segments={[
              {
                colorClass:
                  ' bg-gradient-to-l to-sun-highlight-secondary from-sun-highlight-primary ',
                value: calcUserPercent(),
              },
            ]}
          />
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
        </div>
      )}
    </div>
  )
}
