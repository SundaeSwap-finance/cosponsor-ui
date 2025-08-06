import { LoaderCircle, LogIn, LogOut } from 'lucide-react'
import {
  RenderWallet,
  RenderWalletState,
  TRenderWalletFunctionState,
  useAvailableExtensions,
  useWalletObserver,
} from '@sundaeswap/wallet-lite'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { IconCardano } from '@/icons/IconCardano'
import { Button } from '@/components/shadcn/button'
import React, { createContext, useMemo, useState } from 'react'
import { useTextFormatter } from '@/composables/useTextFormatter'

export const SidebarWallet = ({ sidebarExpanded }: { sidebarExpanded: boolean }) => {
  const walletObserver = useWalletObserver().observer
  const walletList = useAvailableExtensions()
  const { formatMidEllipsis } = useTextFormatter()
  const [modalOpen, setModalOpen] = useState(false)

  const iconActiveWallet = useMemo(() => {
    if (walletList && walletList.length > 0) {
      const filtered = walletList.filter(
        (wallet) =>
          wallet && wallet.name?.toLowerCase() === walletObserver.activeWallet?.toLowerCase()
      )
      return filtered && filtered.length > 0 ? filtered[0].reference.icon : ''
    }
    return ''
  }, [walletList, walletObserver.activeWallet])

  const onClickConnectWallet = (
    connectWallet: {
      (wallet: string): Promise<import('@cardano-sdk/dapp-connector').Cip30WalletApi | undefined>
      (arg0: string): void
    },
    activeWallet: string | undefined
  ) => {
    if (activeWallet) {
      connectWallet(activeWallet).then((r) => {
        setModalOpen(false)
      })
    } else {
      connectWallet('eternl').then((r) => {
        setModalOpen(false)
      })
    }
  }

  return (
    <RenderWallet
      loader={<LoaderCircle className={'animate-spin'} />}
      render={({
        connectWallet,
        usedAddresses,
        disconnect,
        activeWallet,
      }: TRenderWalletFunctionState) => (
        <ModalWalletConnect
          disableTrigger={(activeWallet as string)?.length > 0}
          modalOpen={modalOpen}
          onWalletConnect={(key, wallet) => onClickConnectWallet(connectWallet, key)}
          onModalClose={() => setModalOpen(false)}
          modalTrigger={
            <div
              onClick={() => setModalOpen(true)}
              className={`flex w-full flex-row items-center gap-3 p-4 ${activeWallet ? '' : 'cursor-pointer'} ${sidebarExpanded ? '' : 'justify-center'}`}
            >
              {iconActiveWallet ? (
                <img
                  src={iconActiveWallet}
                  alt={'Wallet icon of ' + walletObserver.activeWallet}
                  className="h-8 w-8"
                />
              ) : (
                <IconCardano
                  className={`joe fill-action-primary size-8 transition-discrete ${sidebarExpanded ? 'flex' : 'hidden'} `}
                />
              )}{' '}
              <div
                className={`flex h-full w-full min-w-0 flex-col gap-0.5 ${sidebarExpanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
              >
                <div className={'sun-text-14-md text-sun-header w-full leading-3.5 capitalize'}>
                  {activeWallet ?? 'Connect a wallet'}
                </div>
                <div className={'sun-text-12-rg text-sun-header w-full'}>
                  {usedAddresses[0] ? formatMidEllipsis(usedAddresses[0], 23) : ''}
                </div>
              </div>
              <Button
                onClick={(event) => {
                  if (activeWallet) {
                    event.preventDefault()
                    event.stopPropagation()
                    disconnect()
                  } else {
                    setModalOpen(true)
                  }
                }}
                title="Log out"
                size="icon"
                variant="ghost"
                className={`size-4 ${sidebarExpanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
              >
                <LogIn
                  className={`text-sun-muted size-4 shrink-0 ${activeWallet ? 'hidden' : 'block'}`}
                />
                <LogOut
                  className={`text-sun-muted size-4 shrink-0 ${activeWallet ? 'block' : 'hidden'}`}
                />
              </Button>
            </div>
          }
        />
      )}
    />
  )
}
