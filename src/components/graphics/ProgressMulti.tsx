import React from 'react'
import * as Progress from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

type ProgressSegment = {
  value: number
  colorClass: string
}

export const ProgressMulti = ({
  className,
  segments,
  ...props
}: {
  className?: string
  segments: ProgressSegment[]
}) => {
  let accumulatedValue = 0

  const isLastSegment = (index: number, segments: ProgressSegment[]) => {
    return index + 1 === segments.length
  }

  return (
    <Progress.Root
      className={cn(
        'bg-sun-surface-muted relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {segments.map((segment, index) => {
        const segmentStyle = {
          width: `${segment.value}%`,
          left: `${accumulatedValue}%`,
        }
        accumulatedValue += segment.value
        return (
          <Progress.Indicator
            key={index}
            className={cn(
              'absolute h-full transition-all',
              segment.colorClass,
              isLastSegment(index, segments) && 'rounded-r-full'
            )}
            style={segmentStyle}
          />
        )
      })}
    </Progress.Root>
  )
}
