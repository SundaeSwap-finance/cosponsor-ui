import { useState } from 'react'
import { IconCardano } from '@/icons/IconCardano'
import { LayoutDashboard, LayoutGrid, LogIn, LogOut, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ButtonSideNav } from '@/components/sidebar/ButtonSideNav'
import { RenderWalletState } from '@sundaeswap/wallet-lite'
import { SheetClose } from '@/components/shadcn/sheet'

export const Sidebar = ({
  onNavigate,
  fromHeader = false,
}: {
  onNavigate?: () => void
  fromHeader?: boolean
}) => {
  const [expanded, setExpanded] = useState(true)

  const toggleButton = () => {
    setExpanded(!expanded)
  }

  const onClickConnectWallet = (
    connectWallet: {
      (wallet: string): Promise<import('@cardano-sdk/dapp-connector').Cip30WalletApi | undefined>
      (arg0: string): void
    },
    activeWallet: string | undefined
  ) => {
    if (!activeWallet) {
      connectWallet('eternl')
    }
  }

  const handleClick = () => {
    console.log('Navigating...')
    onNavigate?.()
  }

  return (
    <div
      className={`bg-sun-surface-muted flex h-full min-h-screen shrink-0 flex-col justify-between transition-all duration-300 ${expanded ? 'w-62' : 'w-17'}`}
    >
      <div className={'flex h-full w-full flex-col'}>
        <div className="flex h-17 flex-row items-center justify-between px-4">
          <IconCardano
            classSvg={`size-8 fill-action-primary transition-discrete ${expanded ? 'flex' : 'hidden'} `}
          />

          {!fromHeader && (
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
              onClick={handleClick}
              label="Your Pledges"
              icon={<LayoutDashboard className="size-4" />}
              path="/your"
              expanded={expanded}
            />

            <ButtonSideNav
              onClick={handleClick}
              label="All Proposals"
              icon={<LayoutGrid className="size-4 rotate-45" />}
              path="/all"
              expanded={expanded}
            />
          </div>
        </div>
      </div>
      <RenderWalletState
        render={({ connectWallet, usedAddresses, disconnect, activeWallet }) => (
          <div
            onClick={() => onClickConnectWallet(connectWallet, activeWallet)}
            className={`flex w-full flex-row items-center gap-3 p-4 ${activeWallet ? '' : 'cursor-pointer'} ${expanded ? '' : 'justify-center'}`}
          >
            {/*TODO: get the icon of the connected wallet here instead of the ADA logo.*/}
            <IconCardano classSvg={`size-6 shrink-0 fill-action-primary  `} />
            <div
              className={`flex h-full w-full min-w-0 flex-col gap-0.5 ${expanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
            >
              <div className={'sun-text-14-md text-sun-header w-full leading-3.5 capitalize'}>
                {activeWallet ?? 'Connect a wallet'}
              </div>
              <div className={'sun-text-12-rg text-sun-header w-full truncate'}>
                {usedAddresses}
              </div>
            </div>
            <Button
              title="Log out"
              size="icon"
              variant="ghost"
              onClick={() => disconnect()}
              className={`size-4 ${expanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
            >
              <LogIn
                className={`text-sun-muted size-4 shrink-0 ${activeWallet ? 'hidden' : 'block'}`}
              />
              <LogOut
                className={`text-sun-muted size-4 shrink-0 ${activeWallet ? 'block' : 'hidden'}`}
              />
            </Button>
          </div>
        )}
      />
    </div>
  )
}
