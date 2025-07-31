import { useTextFormatter } from '@/composables/useTextFormatter'
import { useMemo } from 'react'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'

export const CardProposalPledgeSingle = ({
  pledgeAddr,
  handle,
  amount,
  reqBudget,
}: {
  pledgeAddr: string
  handle?: string
  amount: number
  reqBudget: number
}) => {
  const { formatMidEllipsis } = useTextFormatter()
  const { formatNumber } = useNumberFormatter()

  const percentage = useMemo(() => {
    return ((amount / reqBudget) * 100).toFixed(2)
  }, [amount, reqBudget])

  return (
    <div
      className={'border-sun-border-primary flex flex-row justify-between rounded-lg border p-4'}
    >
      <div className={'flex flex-col gap-0.5'}>
        <div className={'text-sun-default sun-text-16-md'}>{handle}</div>
        <div className={'sun-text-12-md text-sun-muted'}>{formatMidEllipsis(pledgeAddr, 16)}</div>
      </div>
      <div className={'flex flex-col items-end gap-0.5'}>
        <div className={'text-sun-default sun-text-16-md'}>
          ₳{formatNumber(amount, maxDecimalsAda)}
        </div>
        <div
          className={
            'sun-text-10-md text-sun-muted border-sun-border-primary flex h-4.5 w-11 items-center justify-center rounded-full border text-center'
          }
        >
          {percentage}%
        </div>
      </div>
    </div>
  )
}
