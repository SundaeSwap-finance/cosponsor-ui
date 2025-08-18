import * as Progress from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export const ProgressMilestones = ({
  value,
  milestones,
}: {
  value: number
  milestones: number[]
}) => {
  const [visualProgress, setVisProgress] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      setVisProgress(value <= 100 && value > 0 ? value : 0)
    }, 100)
  }, [value])

  return (
    <div className={'relative flex pt-1 pb-6'}>
      <Progress.Root
        value={visualProgress}
        className={'bg-sun-surface-muted h-2 w-full rounded-full'}
      >
        <Progress.Indicator
          className={cn(`bg-sun-action-tertiary h-2 rounded-full transition-all duration-1000`)}
          style={{ width: `${visualProgress}%` }}
        />
      </Progress.Root>
      {milestones.map((milestone, index) => (
        <div
          key={index}
          className="absolute mt-3.5 flex h-[37px] -translate-x-1/2 -translate-y-1/2 flex-col gap-2"
          style={{ left: `${milestone}%` }}
        >
          <div
            className={
              'bg-sun-white-pure size-4 rounded-full border-2 transition-colors ' +
              `${
                visualProgress >= milestone
                  ? 'border-sun-action-tertiary'
                  : 'border-sun-surface-muted'
              }`
            }
          />
          <div className={'sun-text-10-rg text-sun-muted text-center'}>{milestone}%</div>
        </div>
      ))}
    </div>
  )
}
