import { ExternalLink } from 'lucide-react'
import { useNumberFormatter } from '@/composables/useNumberFormatter'
import { maxDecimalsAda } from '@/config/config'
import { getExplorerTxUrl } from '@/lib/cardano/cardanoscan'

export const BannerProposalSubmitted = ({
  userPledge,
  submissionTxHash,
}: {
  userPledge: number
  submissionTxHash?: string
}) => {
  const { formatNumber } = useNumberFormatter()

  return (
    <div
      className={
        'border-sun-border-primary bg-sun-surface-muted/50 flex flex-col gap-4 rounded-lg border p-6'
      }
    >
      <div className={'flex flex-col gap-2'}>
        <div className={'text-sun-header sun-text-20-sb leading-5'}>
          Submitted On-Chain – Governance Action Live
        </div>
        <div className={'sun-text-16-md text-sun-default'}>
          This proposal reached its funding target and was submitted as a governance action. The
          pooled deposit is locked with the action until it resolves.
          {userPledge > 0 && (
            <>
              {' '}
              Your <b>{formatNumber(userPledge, maxDecimalsAda)} ADA</b> pledge is part of the
              deposit — hold on to your <b>gADA</b> to claim your share of the refund when the
              action concludes.
            </>
          )}
        </div>
      </div>
      {submissionTxHash && (
        <a
          href={getExplorerTxUrl(submissionTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className={
            'text-sun-header sun-text-14-md flex w-fit flex-row items-center gap-1.5 underline decoration-dotted underline-offset-4'
          }
        >
          View submission on CardanoScan
          <ExternalLink className={'size-3.5'} />
        </a>
      )}
    </div>
  )
}
