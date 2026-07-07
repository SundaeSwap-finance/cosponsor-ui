import React from 'react'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { ModalPropose } from '@/components/modals/proposalAction/ModalPropose'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { cn } from '@/lib/utils'
import { IProposalCardData } from '@/types/Proposal'
import { useWalletVerification } from '@/composables/useWalletVerification'

export const ButtonPropose = ({
  proposalId,
  proposal,
  content,
  classButton,
}: {
  proposalId: string
  /** Optional full proposal data. If provided, the submission is linked to it. */
  proposal?: IProposalCardData
  content: React.ReactNode
  classButton?: string
}) => {
  const triggerId = `proposeButton${proposalId}`
  const {
    verifyWalletConnection,
    walletConnectModalOpen,
    setWalletConnectModalOpen,
    handleWalletConnect,
  } = useWalletVerification(triggerId)

  return (
    <>
      <ModalPropose
        proposal={proposal}
        modalTrigger={
          <ButtonGradient
            id={triggerId}
            size="lg"
            className={cn('flex-1', classButton)}
            onClick={(event) => verifyWalletConnection(event)}
          >
            {content}
          </ButtonGradient>
        }
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
