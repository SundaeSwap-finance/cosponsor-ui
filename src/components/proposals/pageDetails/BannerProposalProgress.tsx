import { ProgressMilestones } from '@/components/graphics/ProgressMilestones'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

export const BannerProposalProgress = ({
  completionPercentage,
  totalPledged,
  requestedBudget,
}: {
  completionPercentage: number
  totalPledged: number
  requestedBudget: number
}) => {
  const { formatNumber } = useNumberFormatter()

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex flex-col justify-between md:flex-row md:items-center'}>
        <div className={'sun-text-22-md text-sun-header'}>
          {completionPercentage.toPrecision(4)}% sponsored
        </div>
        <div className={'flex flex-row items-end'}>
          <div className={'sun-text-22-md text-sun-header'}>
            ₳{formatNumber(totalPledged, maxDecimalsAda)}
          </div>
          <div className={'sun-text-18-md text-sun-muted'}>
            /₳{formatNumber(requestedBudget, maxDecimalsAda)}
          </div>
        </div>
      </div>
      <ProgressMilestones value={completionPercentage} milestones={[0, 25, 50, 75, 100]} />
    </div>
  )
}
