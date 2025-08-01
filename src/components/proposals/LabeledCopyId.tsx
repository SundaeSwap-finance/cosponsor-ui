import { Clipboard, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import { useTextFormatter } from '@/composables/useTextFormatter'
import { useScreenSize } from '@/composables/useScreenSize'

export const LabeledCopyId = ({
  label,
  id,
  midEllips = false,
}: {
  label: string
  id: string
  midEllips?: boolean
}) => {
  const { formatMidEllipsis } = useTextFormatter()
  const { isMd } = useScreenSize()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className={'flex flex-col gap-1'}>
      <div className={'sun-text-12-md text-sun-muted leading-5'}>{label}</div>
      <div
        onClick={() => copyToClipboard()}
        title={label + ': ' + id}
        className={
          'sun-text-16-md text-sun-action-tertiary flex cursor-pointer flex-row gap-4 leading-5 underline decoration-dotted underline-offset-4'
        }
      >
        {midEllips ? (isMd ? formatMidEllipsis(id, 48) : formatMidEllipsis(id, 32)) : id}
        <div
          className={[
            copied ? 'border-sun-action-tertiary' : 'border-sun-border-primary',
            'text-sun-muted flex size-5 items-center justify-center rounded-sm border',
          ].join(' ')}
        >
          <>
            {copied ? (
              <ClipboardCheck className={'text-sun-action-tertiary size-3'} />
            ) : (
              <Clipboard className={'size-3'} />
            )}
          </>
        </div>
      </div>
    </div>
  )
}
