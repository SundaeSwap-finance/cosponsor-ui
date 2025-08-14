import { Button } from '@/components/shadcn/button'
import { ArrowUpFromLine } from 'lucide-react'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'
import { ModalWithdraw } from '@/components/modals/proposalAction/ModalWithdraw'
import { iProposalCardData } from '@/types/Proposal'
import { ButtonWithdraw } from '@/components/button/ButtonWithdraw'

export const BannerProposalExpired = ({
  userPledge,
  proposal,
}: {
  userPledge: number
  proposal: iProposalCardData
}) => {
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
        <ButtonWithdraw
          classButton={'sun-text-16-rg w-fit'}
          proposal={proposal}
          content={
            <>
              <ArrowUpFromLine />
              Withdraw Pledge
            </>
          }
        />
      )}
    </div>
  )
}
