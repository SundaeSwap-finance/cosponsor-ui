import { Button } from '@/components/shadcn/button'
import { ModalWithdraw } from '@/components/modals/proposalAction/ModalWithdraw'
import { iProposalCardData } from '@/types/Proposal'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { useWalletObserver } from '@sundaeswap/wallet-lite'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const ButtonWithdraw = ({
  proposal,
  content,
  classButton,
}: {
  proposal: iProposalCardData
  content: React.ReactNode
  classButton?: string
}) => {
  const walletObserver = useWalletObserver()
  const [walletConnectModal, setWalletConnectModal] = useState<boolean>(false)

  const verifyWalletConnection = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (walletObserver && walletObserver.activeWallet) {
      // continue as usual with user action
    } else {
      event.stopPropagation()
      event.preventDefault()
      setWalletConnectModal(true)
    }
  }

  return (
    <>
      <ModalWithdraw
        modalTrigger={
          <Button
            id={'withdrawButton' + proposal.id}
            onClick={(event) => verifyWalletConnection(event)}
            size="lg"
            className={cn(
              'bg-sun-action-tertiary hover:bg-sun-action-tertiary/90 text-sun-white-pure sun-text-16-md w-full',
              classButton
            )}
          >
            {content}
          </Button>
        }
        proposal={proposal}
      />

      <ModalWalletConnect
        modalTrigger={''}
        modalOpen={walletConnectModal}
        onModalClose={() => setWalletConnectModal(false)}
        onWalletConnect={(key, wallet) => {
          walletObserver.connectWallet(key).then(() => {
            document.getElementById('withdrawButton' + proposal.id)?.click()
          })
        }}
      />
    </>
  )
}
