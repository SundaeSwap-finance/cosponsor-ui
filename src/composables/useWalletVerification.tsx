import React, { useState } from 'react'
import { useWalletObserver } from '@sundaeswap/wallet-lite'

/**
 * Encapsulates the "click button → check wallet → open connect modal if needed → re-trigger button after connect" pattern.
 *
 * @param triggerElementId DOM id of the button that should be re-clicked after a successful wallet connection.
 * @returns Handlers and state for the wallet connection modal flow.
 */
export const useWalletVerification = (triggerElementId: string) => {
  const walletObserver = useWalletObserver()
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState<boolean>(false)

  /**
   * Click handler that lets the action through if a wallet is connected,
   * otherwise blocks the event and opens the wallet connect modal.
   */
  const verifyWalletConnection = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (walletObserver && walletObserver.activeWallet) {
      // continue as usual with user action
      return
    }
    event.stopPropagation()
    event.preventDefault()
    setWalletConnectModalOpen(true)
  }

  /**
   * After the user picks a wallet in the connect modal, connect it and
   * programmatically re-click the original trigger button.
   */
  const handleWalletConnect = (key: string) => {
    walletObserver.connectWallet(key).then(() => {
      document.getElementById(triggerElementId)?.click()
    })
  }

  return {
    verifyWalletConnection,
    walletConnectModalOpen,
    setWalletConnectModalOpen,
    handleWalletConnect,
  }
}
