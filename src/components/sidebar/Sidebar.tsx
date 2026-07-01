import React, { useState } from 'react'
import { IconCardano } from '@/icons/IconCardano'
import { HelpCircle, LayoutDashboard, LayoutGrid, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ButtonSideNav } from '@/components/sidebar/ButtonSideNav'
import { cn } from '@/lib/utils'
import { SidebarWallet } from '@/components/sidebar/SidebarWallet'
import { buildInfo } from '@/lib/buildInfo'

export const Sidebar = ({
  onNavigate,
  mobileSheet = false,
}: {
  onNavigate?: () => void
  mobileSheet?: boolean
}) => {
  const [expanded, setExpanded] = useState(true)

  const toggleButton = () => {
    setExpanded(!expanded)
  }

  return (
    <div
      className={cn(
        `bg-sun-surface-muted flex h-full min-h-screen shrink-0 flex-col justify-between transition-all duration-300`,
        mobileSheet ? 'w-full' : expanded ? 'w-62' : 'w-17'
      )}
    >
      <div className={'flex h-full w-full flex-col'}>
        <div className="flex h-17 flex-row items-center justify-between px-4">
          <IconCardano
            className={`fill-action-primary size-8 transition-discrete ${expanded ? 'flex' : 'hidden'} `}
          />

          {!mobileSheet && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleButton()}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <PanelLeftClose
                className={`text-sun-muted size-4 transition-transform ${expanded ? '' : 'rotate-180'}`}
              />
            </Button>
          )}
        </div>
        <div className={`flex w-full min-w-0 flex-col gap-2 p-2`}>
          <div className={`${expanded ? 'flex opacity-100' : 'hidden opacity-0'}`}>Overview</div>
          <div className={`flex w-full flex-col items-center gap-2`}>
            <ButtonSideNav
              onClick={() => onNavigate?.()}
              label="Your Pledges"
              icon={<LayoutDashboard className="size-4" />}
              path="/your-pledges"
              expanded={expanded}
            />

            <ButtonSideNav
              onClick={() => onNavigate?.()}
              label="All Proposals"
              icon={<LayoutGrid className="size-4 rotate-45" />}
              path="/all-proposals"
              expanded={expanded}
            />

            <ButtonSideNav
              onClick={() => onNavigate?.()}
              label="About"
              icon={<HelpCircle className="size-4" />}
              path="/about"
              expanded={expanded}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <SidebarWallet sidebarExpanded={expanded} />
        <div
          title={buildInfo.commitHash || undefined}
          className={`text-sun-muted sun-text-12-md px-4 pb-2 ${expanded ? 'flex' : 'hidden'}`}
        >
          v{buildInfo.buildId || 'dev'}
        </div>
      </div>
    </div>
  )
}
