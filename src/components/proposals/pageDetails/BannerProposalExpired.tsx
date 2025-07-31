import { Button } from '@/components/shadcn/button'
import { ArrowUpFromLine } from 'lucide-react'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

export const BannerProposalExpired = ({ userPledge }: { userPledge: number }) => {
  const { formatNumber } = useNumberFormatter()

  return (
    <div
      className={
        'border-sun-action-tertiary/20 bg-sun-action-tertiary/10 flex flex-col gap-4 rounded-lg border p-6'
      }
    >
      <div className={'flex flex-col gap-2'}>
        <div className={'text-sun-action-tertiary sun-text-20-sb leading-5'}>
          Proposal Unfunded
          {userPledge > 0 && <> – Please Withdraw Your Pledge</>}
        </div>
        <div className={'sun-text-16-md text-sun-action-tertiary'}>
          This proposal’s governance action has expired without reaching its funding target. <br />
          {userPledge > 0 && (
            <>
              Redeem your <b>{formatNumber(userPledge, maxDecimalsAda)} ADA</b> by depositing your{' '}
              <b>gADA.</b>
            </>
          )}
        </div>
      </div>

      {userPledge > 0 && (
        <Button
          size="lg"
          className={
            'bg-sun-action-tertiary text-sun-white-pure sun-text-16-rg hover:bg-sun-action-tertiary/80 w-fit'
          }
        >
          <ArrowUpFromLine />
          Withdraw Pledge
        </Button>
      )}
    </div>
  )
}
