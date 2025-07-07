import { FC, useState } from 'react'
import { IconCardano } from '@/icons/IconCardano'
import { LayoutDashboard, LayoutGrid, LogIn, LogOut, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ButtonSideNav } from '@/components/sidebar/ButtonSideNav'
import { RenderWallet, RenderWalletState } from '@sundaeswap/wallet-lite'

export const Sidebar: FC = () => {
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

  return (
    <div
      className={`bg-sun-surface-muted flex h-full min-h-screen shrink-0 flex-col justify-between transition-all duration-500 ${expanded ? 'w-62' : 'w-17'}`}
    >
      <div className={'flex h-full w-full flex-col'}>
        <div className="flex h-17 flex-row items-center justify-between px-4">
          <IconCardano
            classSvg={`size-8 fill-action-primary transition-discrete ${expanded ? 'flex' : 'hidden'} `}
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggleButton()}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <PanelLeftClose
              className={`text-sun-muted size-4 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
            />
          </Button>
        </div>
        <div
          className={`flex w-full min-w-0 flex-col p-2 ${expanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
        >
          <div>Overview</div>
          <ButtonSideNav label="Your Pledges" icon={<LayoutDashboard className="size-4" />} />
          <ButtonSideNav label="All Proposals" icon={<LayoutGrid className="size-4 rotate-45" />} />
        </div>
      </div>
      <RenderWalletState
        render={({ connectWallet, usedAddresses, disconnect, activeWallet }) => (
          <div
            onClick={() => onClickConnectWallet(connectWallet, activeWallet)}
            className={`flex w-full flex-row items-center gap-3 p-4 ${expanded ? 'flex opacity-100' : 'hidden opacity-0'} ${activeWallet ? '' : 'cursor-pointer'}`}
          >
            {/*TODO: get the icon of the connected wallet here instead of the ADA logo.*/}
            <IconCardano classSvg={`size-6 shrink-0 fill-action-primary  `} />
            <div className={'flex h-full w-full min-w-0 flex-col gap-0.5'}>
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
              className={'size-4'}
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
