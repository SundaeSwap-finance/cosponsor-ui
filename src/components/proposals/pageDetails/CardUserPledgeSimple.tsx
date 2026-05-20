import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'
import { ProgressMulti } from '@/components/graphics/ProgressMulti'
import { ButtonWithdraw } from '@/components/button/ButtonWithdraw'
import { IProposalCardData } from '@/types/Proposal'

export const CardUserPledgeSimple = ({
  reqBudget,
  userPledge,
  proposal,
}: {
  reqBudget: number | undefined
  userPledge: number | undefined
  proposal: IProposalCardData
}) => {
  const { formatNumber } = useNumberFormatter()

  const calculatePercent = () => {
    if (userPledge && reqBudget) {
      return Math.round((userPledge / reqBudget) * 100)
    }
    return -1
  }

  return (
    <div className={'border-sun-border-primary flex w-full flex-col gap-4 rounded-lg border p-4'}>
      <div className={'flex w-full flex-row items-start justify-between'}>
        <div className={'flex w-fit flex-col gap-0.5'}>
          <div className={'sun-text-12-md text-sun-muted'}>Your Pledge</div>
          <div
            className={
              'sun-text-24-sb to-sun-highlight-secondary from-sun-highlight-primary bg-gradient-to-r bg-clip-text text-nowrap text-transparent'
            }
          >
            ₳{formatNumber(userPledge ?? -1, maxDecimalsAda)}
          </div>
        </div>
        <ButtonWithdraw proposal={proposal} content="Withdraw Pledge" classButton="w-auto" />
      </div>
      <div className={'flex w-full flex-row items-center gap-2'}>
        <ProgressMulti
          segments={[
            {
              colorClass: `to-sun-highlight-secondary from-sun-highlight-primary rounded-full bg-gradient-to-r`,
              value: calculatePercent(),
            },
          ]}
          className={'from-sun-highlight-primary/10 to-sun-highlight-secondary/10 bg-gradient-to-r'}
        />

        <div
          className={
            'to-sun-highlight-secondary/20 from-sun-highlight-primary/20 relative inline-block rounded-full bg-linear-to-r p-[0.75px]'
          }
        >
          <div
            className={'sun-text-10-md bg-sun-white-pure/50 h-full w-full rounded-full px-2 py-0.5'}
          >
            <div
              className={
                'to-sun-highlight-secondary from-sun-highlight-primary bg-gradient-to-r bg-clip-text text-transparent'
              }
            >
              {calculatePercent().toPrecision(4)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
