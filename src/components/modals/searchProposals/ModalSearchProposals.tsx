import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import React, { ReactNode, useMemo, useState } from 'react'
import { DialogContentSundae } from '@/components/modals/DialogContentSundae'
import { ArrowDown, ArrowUp, CornerDownLeft, Redo2, Search, X } from 'lucide-react'
import { InputIcon } from '@/components/input/InputIcon'
import { SearchResultProposal } from '@/components/modals/searchProposals/SearchResultProposal.'
import { SearchActionHint } from '@/components/modals/searchProposals/SearchActionHint'
import { useGetProposalData } from '@/composables/useGetProposalData'

export const ModalSearchProposals = ({ modalTrigger }: { modalTrigger: ReactNode }) => {
  const { getAllProposalCards } = useGetProposalData()
  const allProposals = getAllProposalCards()
  const [inputValue, setInputValue] = useState('')

  const filteredProposals = useMemo(() => {
    if (inputValue.length > 0) {
      return allProposals.filter((proposal) => {
        return (
          proposal.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          proposal.ownerName.toLowerCase().includes(inputValue.toLowerCase()) ||
          proposal.companyName.toLowerCase().includes(inputValue.toLowerCase()) ||
          proposal.companyDomain.toLowerCase().includes(inputValue.toLowerCase()) ||
          proposal.categoryName.toLowerCase().includes(inputValue.toLowerCase())
        )
      })
    } else {
      return allProposals.slice(0, 3)
    }
  }, [inputValue, allProposals])

  const handleInput = (e) => {
    setInputValue(e.target.value)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{modalTrigger}</DialogTrigger>
      <DialogContentSundae className={'w-1/3 gap-6 rounded-3xl'} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={'sun-text-20-md text-sun-header text-left'}>
            Search Proposals
          </DialogTitle>
          <DialogDescription className={'sun-text-14-rg text-sun-default text-left'}>
            Discover proposals to sponsor!
          </DialogDescription>
        </DialogHeader>
        <InputIcon
          value={inputValue}
          onChange={handleInput}
          icon={<Search className={'text-sun-header size-4'} />}
          iconPosition="left"
          type="text"
          placeholder="Search proposal by title or dRep ID"
          className={'!bg-sun-white-pure !placeholder-sun-muted w-full'}
        />
        <div className={'flex flex-col'}>
          {filteredProposals.map((proposal) => (
            <SearchResultProposal proposal={proposal} />
          ))}
        </div>
        <DialogFooter
          className={
            'sun-text-12-rg text-sun-default border-sun-border-primary flex flex-row gap-6 border-t pt-6'
          }
        >
          <SearchActionHint
            icons={[<ArrowUp className={'size-3.5'} />, <ArrowDown className={'size-3.5'} />]}
            actionName={'to navigate'}
          />
          <SearchActionHint
            icons={[<CornerDownLeft className={'size-3.5'} />]}
            actionName={'to select'}
          />
          <SearchActionHint icons={[<X className={'size-3.5'} />]} actionName={'to close'} />
        </DialogFooter>
      </DialogContentSundae>
    </Dialog>
  )
}
