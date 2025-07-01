import { FC, ReactNode } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ButtonSideNav: FC<{ label?: string; icon?: ReactNode }> = ({ label, icon }) => {
  return (
    <div className="text-14-md text-content-header border-white-pure hover:bg-surface-muted flex h-8 w-full cursor-pointer flex-row items-center justify-start gap-2 rounded-sm bg-none px-2 py-1.5 focus-within:border-2">
      {icon}
      <div>{label}</div>
    </div>
  )
}
