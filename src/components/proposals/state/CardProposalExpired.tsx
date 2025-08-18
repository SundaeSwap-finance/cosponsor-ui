import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

export const CardProposalExpired = ({ userPledge }: { userPledge: number | undefined }) => {
  const { formatNumber } = useNumberFormatter()
  return (
    <div
      className={
        'border-sun-action-tertiary/20 bg-sun-action-tertiary/10 flex flex-col gap-1 rounded-lg border p-4'
      }
    >
      <div className={'text-sun-action-tertiary sun-text-16-sb'}>Proposal Unfunded</div>
      <div className={'sun-text-12-md text-sun-action-tertiary'}>
        This proposal’s governance action has expired without reaching its funding target.{' '}
        {userPledge && userPledge > 0 ? (
          <>
            Redeem your <b>{formatNumber(userPledge, maxDecimalsAda)} ADA</b> by depositing your{' '}
            <b>gADA.</b>
          </>
        ) : null}
      </div>
    </div>
  )
}
