import React from 'react'
import { Button } from '@/components/shadcn/button'
import { ModalWithdraw } from '@/components/modals/proposalAction/ModalWithdraw'
import { IProposalCardData } from '@/types/Proposal'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { cn } from '@/lib/utils'
import { useWalletVerification } from '@/composables/useWalletVerification'

export const ButtonWithdraw = ({
  proposal,
  content,
  classButton,
}: {
  proposal: IProposalCardData
  content: React.ReactNode
  classButton?: string
}) => {
  const triggerId = `withdrawButton${proposal.id}`
  const {
    verifyWalletConnection,
    walletConnectModalOpen,
    setWalletConnectModalOpen,
    handleWalletConnect,
  } = useWalletVerification(triggerId)

  return (
    <>
      <ModalWithdraw
        modalTrigger={
          <Button
            id={triggerId}
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
        modalOpen={walletConnectModalOpen}
        onModalClose={() => setWalletConnectModalOpen(false)}
        onWalletConnect={(key, _wallet) => handleWalletConnect(key)}
      />
    </>
  )
}
