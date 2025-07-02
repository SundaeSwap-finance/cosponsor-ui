import { FC, ReactNode } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/shadcn/button'

export const ButtonSideNav: FC<{ label?: string; icon?: ReactNode }> = ({ label, icon }) => {
  return (
    <div className="text-14-md text-sun-header border-white-pure hover:bg-surface-muted flex h-8 w-full min-w-0 cursor-pointer flex-row items-center justify-start gap-2 truncate rounded-sm bg-none px-2 py-1.5 focus-within:border-2">
      {icon}
      <div>{label}</div>
    </div>
  )
}
