import React from 'react'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { ModalSponsor } from '@/components/modals/proposalAction/ModalSponsor'
import { ModalWalletConnect } from '@/components/modals/walletConnect/ModalWalletConnect'
import { cn } from '@/lib/utils'
import { useWalletObserver } from '@sundaeswap/wallet-lite'
import { useState } from 'react'
import { IProposalCardData } from '@/types/Proposal'

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
      <ModalSponsor
        proposal={proposal}
        modalTrigger={
          <ButtonGradient
            id={`sponsorButton${proposalId}`}
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
        modalOpen={walletConnectModal}
        onModalClose={() => setWalletConnectModal(false)}
        onWalletConnect={(key, _wallet) => {
          walletObserver.connectWallet(key).then(() => {
            document.getElementById(`sponsorButton${proposalId}`)?.click()
          })
        }}
      />
    </>
  )
}
