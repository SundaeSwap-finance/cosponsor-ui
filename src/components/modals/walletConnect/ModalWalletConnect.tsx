import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import { WalletConnectFlow } from '@sundaeswap/ui-toolkit'
import React, { ReactNode, useEffect, useState } from 'react'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { IWindowCip30Extension } from '@sundaeswap/wallet-lite'

export const ModalWalletConnect = ({
  modalTrigger,
  onWalletConnect,
  disableTrigger,
  modalOpen,
  onModalClose,
}: {
  modalTrigger: ReactNode
  onWalletConnect?: (key: string, wallet: IWindowCip30Extension) => void
  disableTrigger: boolean
  modalOpen: boolean
  onModalClose?: () => void
}) => {
  const i18nData = {
    description: 'Select the wallet you want to connect below.',
    noWallets:
      'It seems like you have no wallets installed in your browser. Download Nami or Eternl to interact with this page.',
    title: 'Connect to a Wallet',
    suggestWallet: "Can't find your wallet?",
    walletConnect: 'Connect Wallet',
    learnMore: 'Learn more about wallets',
    legalDisclaimerTitle: 'Accept the Legal Disclaimer',
    selectWalletNoticeTitle: 'Select a wallet please.',
    selectWalletNotice: 'Select a wallet to connect',
    errorTitle: '',
    error: '',
  }

  const onConnect = (key: string, wallet: IWindowCip30Extension) => {
    onWalletConnect?.(key, wallet)
  }

  const onLocalCloseModal = () => {
    onModalClose?.()
  }

  return (
    <Dialog open={modalOpen}>
      <DialogTrigger asChild disabled={disableTrigger}>
        {modalTrigger}
      </DialogTrigger>
      <DialogContentSundae
        onClickOverlay={() => onLocalCloseModal()}
        id={'walletConnectModal'}
        className={'w-full gap-6 overflow-x-hidden rounded-3xl md:w-150'}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Connect your wallet
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            Select the wallet you want to connect below.
          </DialogDescription>
        </DialogHeader>
        <WalletConnectFlow
          i18n={i18nData}
          isLoading={false}
          legalDisclaimer={
            <>
              TODO: This is a sample legal disclaimer. You can provide links, descriptions or
              anything you want. In case you want to provide links etc.
            </>
          }
          onConnectWallet={(key, wallet) => onConnect(key, wallet)}
          noWalletsComponent={'No Wallets 💔'}
          suggestWalletRoute={'https://help.sundaeswap.finance/en/collections/3303291-wallets'}
        />
      </DialogContentSundae>
    </Dialog>
  )
}
