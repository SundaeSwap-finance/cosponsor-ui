import { cn } from '@/lib/utils'
import React from 'react'
import { Input } from '../shadcn/input'

export const InputDefault = ({ className, ...props }: React.ComponentProps<'input'>) => {
  return <Input className={cn('border-sun-border-primary', className)} {...props} />
}
