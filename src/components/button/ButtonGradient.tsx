import React from 'react'
import { Button } from '@/components/shadcn/button'
import { cn } from '@/lib/utils'

export const ButtonGradient = ({
  className,
  asChild,
  size,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean } & {
  size?: 'default' | 'sm' | 'lg' | 'icon' | null | undefined
}) => {
  return (
    <Button
      asChild={asChild}
      size={size}
      className={cn(
        'from-sun-highlight-primary to-sun-highlight-secondary bg-gradient-to-r hover:opacity-90',
        className
      )}
      {...props}
    />
  )
}
