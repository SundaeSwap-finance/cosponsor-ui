import React from 'react'
import { Button } from '@/components/shadcn/button'
import { cn } from '@/lib/utils'

export const ButtonGradient = ({ className, ...props }: React.ComponentProps<'button'>) => {
  return (
    <Button
      className={cn(
        'from-sun-highlight-primary to-sun-highlight-secondary bg-gradient-to-r',
        className
      )}
      {...props}
    />
  )
}
