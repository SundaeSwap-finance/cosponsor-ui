import React from 'react'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { ModalSponsor } from '@/components/modals/proposalAction/ModalSponsor'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { cn } from '@/lib/utils'
import { IProposalCardData } from '@/types/Proposal'
import { useWalletVerification } from '@/composables/useWalletVerification'

export const ButtonSponsor = ({
  proposalId,
  proposal,
  content,
  classButton,
}: {
  proposalId: string
  /** Optional full proposal data. If provided, deposit will be linked to this proposal. */
  proposal?: IProposalCardData
  content: React.ReactNode
  classButton?: string
}) => {
  const triggerId = `sponsorButton${proposalId}`
  const {
    verifyWalletConnection,
    walletConnectModalOpen,
    setWalletConnectModalOpen,
    handleWalletConnect,
  } = useWalletVerification(triggerId)

  return (
    <>
      <ModalSponsor
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
