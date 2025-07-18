import { iProposalCardData, iProposalDetailsData } from '@/types/Proposal'
import { useState } from 'react'

import { cardData, detailsData } from '@/devData/proposalPlaceholders'

export const useGetProposalData = () => {
  const [proposalCardCache, setProposalCardCache] = useState()

  // Placeholder data and methods, refine when data is available.
  // TODO: replace with getting/refreshing data from BE in this file.
  // Current idea is to only deliver relevant data to the client. So for cards only the data on the cards.

  const getProposalCardById = async (id: string): Promise<iProposalCardData> => {
    //console.log('getProposalCardById', id)
    return cardData.filter((proposal) => proposal.id === id)[0]
  }
  const getProposalDetailsById = (id: string) => {
    console.log('getProposalDetailsById', id)
    return detailsData.filter((proposal) => proposal.id === id)[0]
  }

  const getProposalCategories = () => {
    //console.log('getProposalCategories')
    const setCategories = new Set()
    for (let i = 0; i < cardData.length; i++) {
      setCategories.add(cardData[i].categoryName)
    }
    return Array.from(setCategories)
  }

  const getProposalCardsInCategory = (categoryName: string) => {
    //console.log('getProposalCardsInCategory', categoryName)
    return cardData.filter(
      (proposal) => proposal.categoryName.toLowerCase() === categoryName.toLowerCase()
    )
  }

  const getProposalCardsUserPledge = () => {
    //console.log('getProposalCardsUserPledge')
    return cardData.filter((proposal) => proposal.userPledged && proposal.userPledged > 0)
  }

  return {
    getProposalCardById,
    getProposalDetailsById,
    getProposalCardsInCategory,
    getProposalCardsUserPledge,
    getProposalCategories,
  }
}
