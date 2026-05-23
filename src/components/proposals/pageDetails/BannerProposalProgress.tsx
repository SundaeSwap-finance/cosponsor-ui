import { ProgressMilestones } from '@/components/graphics/ProgressMilestones'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

export const BannerProposalProgress = ({
  completionPercentage,
  totalPledged,
  cosponsorTarget,
}: {
  completionPercentage: number
  totalPledged: number
  cosponsorTarget: number | undefined
}) => {
  const { formatNumber } = useNumberFormatter()

  // cosponsorTarget comes from the live gov_action_deposit param; only
  // missing during the initial fetch. Once we know it (even if no one has
  // pledged yet), show the empty 0% bar instead of falling back to a
  // "Your Pledge" headline.
  const hasTarget = cosponsorTarget !== undefined && cosponsorTarget > 0

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex flex-col justify-between md:flex-row md:items-center'}>
        <div className={'sun-text-22-md text-sun-header'}>
          {hasTarget ? `${completionPercentage.toPrecision(4)}% sponsored` : 'Your Pledge'}
        </div>
        <div className={'flex flex-row items-end'}>
          <div className={'sun-text-22-md text-sun-header'}>
            ₳{formatNumber(totalPledged, maxDecimalsAda)}
          </div>
          {hasTarget && (
            <div className={'sun-text-18-md text-sun-muted'}>
              /₳{formatNumber(cosponsorTarget, maxDecimalsAda)}
            </div>
          )}
        </div>
      </div>
      {hasTarget && (
        <ProgressMilestones value={completionPercentage} milestones={[0, 25, 50, 75, 100]} />
      )}
    </div>
  )
}
