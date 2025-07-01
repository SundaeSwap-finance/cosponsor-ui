import { FC, useState } from 'react'
import { IconCardano } from '@/icons/IconCardano'
import { LayoutDashboard, LayoutGrid, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonSideNav } from '@/components/ButtonSideNav'

export const Sidebar: FC = () => {
  const [expanded, setExpanded] = useState(true)

  const toggleButton = () => {
    console.log('hello it works')
    setExpanded(!expanded)
  }

  return (
    <div
      className={`bg-surface-muted flex h-full min-h-screen flex-col transition-all duration-500 ${expanded ? 'w-62' : 'w-17'}`}
    >
      <div className="flex h-17 flex-row items-center justify-between px-4">
        <IconCardano
          classSvg={`size-8 fill-action-primary transition-discrete ${expanded ? 'flex' : 'hidden'} `}
        />

        <Button size="icon" variant="ghost" onClick={() => toggleButton()}>
          <PanelLeftClose
            className={`text-content-muted size-4 transition-transform duration-500 ${expanded ? '' : 'rotate-180'}`}
          />
        </Button>
      </div>
      <div
        className={`flex flex-col p-2 transition-opacity transition-discrete delay-150 duration-500 ${expanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
      >
        <div>Overview</div>
        <ButtonSideNav label="Your Pledges" icon={<LayoutDashboard className="size-4" />} />
        <ButtonSideNav label="All Proposals" icon={<LayoutGrid className="size-4 rotate-45" />} />
      </div>
    </div>
  )
}
