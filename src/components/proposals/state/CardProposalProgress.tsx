import { Progress } from '@/components/shadcn/progress'
import { maxDecimalsAda } from '@/config/config'
import { useNumberFormatter } from '@/composables/useNumberFormatter'

export const CardProposalProgress = ({
  fundProgress,
  cosponsorTarget,
}: {
  fundProgress: number | undefined
  cosponsorTarget: number | undefined
}) => {
  const { formatNumber } = useNumberFormatter()

  const calculatePercent = () => {
    if (fundProgress && cosponsorTarget) {
      // Clamp at 100%: an over-funded pool (e.g. after the gov_action_deposit
      // target drops) would otherwise overflow the bar past full.
      return Math.min(100, Math.round((fundProgress / cosponsorTarget) * 100))
    }
    return 0
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-2 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between'}>
        <div className={'flex w-full flex-col gap-0.5'}>
          <div className={'sun-text-12-md text-sun-muted text-nowrap'}>Cosponsored</div>
          <div className={'sun-text-20-sb text-sun-header text-nowrap'}>
            ₳{formatNumber(fundProgress ?? 0, maxDecimalsAda)}
          </div>
        </div>
        <div className={'flex w-full flex-col justify-end gap-0.5 text-right'}>
          <div className={'sun-text-12-md text-sun-muted text-nowrap'}>Cosponsor Target</div>
          <div className={'sun-text-14-sb text-sun-header text-nowrap'}>
            ₳{formatNumber(cosponsorTarget ?? 0, maxDecimalsAda)}
          </div>
        </div>
      </div>
      <div className={'flex w-full flex-row items-center gap-2'}>
        <Progress
          value={calculatePercent()}
          className={'[&>div]:bg-sun-action-primary bg-sun-surface-muted [&>div]:rounded-full'}
        />
        <div
          className={
            'border-sun-border-primary text-sun-muted sun-text-10-rg rounded-full border-1 px-2 py-0.5'
          }
        >
          {calculatePercent()}%
        </div>
      </div>
    </div>
  )
}
