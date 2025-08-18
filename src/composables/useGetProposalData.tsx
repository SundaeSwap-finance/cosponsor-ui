import { iProposalCardData, iProposalDetailsData } from '@/types/Proposal'
import { useState } from 'react'

import { cardData, detailsData } from '@/devData/proposalPlaceholders'
import govToolsApi from '@/api/govToolsApi'
import { AxiosError } from 'axios'

export const useGetProposalData = () => {
  const [proposalCardCache, setProposalCardCache] = useState()

  // -- README --
  // TODO: replace with getting/refreshing data from BE in this file.
  // Placeholder dev data is not consistent between details and cards!

  // Details page data
  const getProposalDetailsById = async (id: string) => {
    //console.log('getProposalDetailsById', id)

    // TODO: Get proposal from cosponsor BE, so we know how much is sponsored and by who.
    const cosponsorDetails = detailsData.filter((proposal) => proposal.id === id)[0]

    // console.log('getProposalDetailsById result', result)
    return (await mapGovToolDataToCosponsorFE([cosponsorDetails]))[0]
  }

  const doesCategoryHaveProposals = async (categoryName: string) => {
    // TODO: Get relevant data of this category from Cosponsor BE
    const results = cardData.filter(
      (proposal) => proposal.categoryName.toLowerCase() === categoryName.toLowerCase()
    )
    return results.length > 0
  }

  const getProposalCardsInCategory = async (categoryName: string) => {
    // TODO: Get relevant data of this category from Cosponsor BE
    const cosponsorBeData = cardData.filter(
      (proposal) => proposal.categoryName.toLowerCase() === categoryName.toLowerCase()
    )
    return mapGovToolDataToCosponsorFE(cosponsorBeData)
  }

  const mapGovToolDataToCosponsorFE = (
    list: iProposalCardData[] | iProposalDetailsData[]
  ): Promise<iProposalCardData[] | iProposalDetailsData[]> => {
    const result = list.map(async (proposal) => {
      try {
        const response = await govToolsApi.get('/proposals/' + proposal.id)

        const responseData = response.data.data.attributes.content.attributes
        return {
          ...proposal,
          name: responseData.prop_name,
          ownerId: responseData.user_id,
          ownerName: response.data.data.attributes.user_govtool_username,
          initDate: new Date(responseData.createdAt),
          abstract: responseData.prop_abstract,
          categoryName: responseData.gov_action_type.attributes.gov_action_type_name,
          // Check if this is details type.
          ...('motivation' in proposal
            ? {
                motivation: responseData.prop_motivation,
                rationale: responseData.prop_rationale,
              }
            : {}),
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.warn(error.response?.data?.error?.details, error)
        }
        return proposal
      }
    })
    return Promise.all(result)
  }

  const getAllProposalCards = async () => {
    return mapGovToolDataToCosponsorFE(cardData) as Promise<iProposalDetailsData[]>
  }

  const getProposalCardsUserPledge = () => {
    //console.log('getProposalCardsUserPledge')
    const userPledged = cardData.filter(
      (proposal) => proposal.userPledged && proposal.userPledged > 0
    )
    const result = mapGovToolDataToCosponsorFE(userPledged)
    // console.log(result)
    return result
  }

  const getRandomProposals = async (
    amount: number,
    exceptThisId?: string
  ): Promise<iProposalCardData[]> => {
    const allProposals = await getAllProposalCards()
    const candidates = exceptThisId
      ? allProposals.filter((p) => p.id !== exceptThisId)
      : [...allProposals]
    const shuffled = candidates.sort(() => 0.5 - Math.random())

    return shuffled.slice(0, amount)
  }

  return {
    getProposalDetailsById,
    doesCategoryHaveProposals,
    getProposalCardsInCategory,
    getAllProposalCards,
    getProposalCardsUserPledge,
    getRandomProposals,
  }
}
