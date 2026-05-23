import { maxDecimalsAda } from '@/config/config'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { ProgressMulti } from '@/components/graphics/ProgressMulti'

export const CardProposalUserPledged = ({
  cosponsorTarget,
  userPledge,
}: {
  cosponsorTarget: number | undefined
  userPledge: number | undefined
}) => {
  const { formatNumber } = useNumberFormatter()

  // If cosponsorTarget is 0 or undefined, the deposit param hasn't loaded yet.
  const hasTargetData = cosponsorTarget && cosponsorTarget > 0

  const calcUserPercent = (): number => {
    if (userPledge && hasTargetData) {
      return (userPledge / cosponsorTarget) * 100
    }
    return 0
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-2 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between gap-4'}>
        <div className={'flex w-fit flex-col gap-0.5'}>
          <div
            className={
              'to-sun-highlight-secondary from-sun-highlight-primary sun-text-12-sb bg-gradient-to-r bg-clip-text text-nowrap text-transparent'
            }
          >
            Your Pledge
          </div>
          <div
            className={
              'to-sun-highlight-secondary from-sun-highlight-primary sun-text-20-sb bg-gradient-to-r bg-clip-text text-nowrap text-transparent'
            }
          >
            ₳{formatNumber(userPledge ?? 0, maxDecimalsAda)}
          </div>
        </div>
        {hasTargetData && (
          <div className={'flex w-fit flex-col justify-end gap-0.5 text-right'}>
            <div className={'sun-text-12-md text-sun-muted text-nowrap'}>Cosponsor Target</div>
            <div className={'sun-text-14-sb text-sun-header text-nowrap'}>
              ₳{formatNumber(cosponsorTarget!, maxDecimalsAda)}
            </div>
          </div>
        )}
      </div>
      {hasTargetData && (
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
                {calcUserPercent().toPrecision(4)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
