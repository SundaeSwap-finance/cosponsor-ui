import { InputDefault } from './InputDefault'
import { cn } from '@/lib/utils'
import React from 'react'

interface IconInputProps extends React.ComponentProps<'input'> {
  icon: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const InputIcon = ({ icon, iconPosition = 'left', className, ...props }: IconInputProps) => {
  return (
    <div className="relative flex w-full items-center">
      <div
        className={cn('text-muted-foreground absolute flex h-5 w-5 items-center justify-center', {
          'left-2.5': iconPosition === 'left',
          'right-2.5': iconPosition === 'right',
        })}
      >
        {icon}
      </div>
      <InputDefault
        className={cn(
          {
            'pl-10': iconPosition === 'left',
            'pr-10': iconPosition === 'right',
          },
          '!ring-0',
          className
        )}
        {...props}
      />
    </div>
  )
}
