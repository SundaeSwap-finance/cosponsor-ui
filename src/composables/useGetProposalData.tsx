import { iProposalCardData } from '@/types/Proposal'
import { useState } from 'react'
import { CarouselApi } from '@/components/shadcn/carousel'

export const useGetProposalData = () => {
  const [proposalCardCache, setProposalCardCache] = useState()

  // TODO replace with BE data input
  // TODO: implement getting/refreshing data from BE in this file.

  const data = [
    // Partially funded, also by user
    {
      id: '0',
      name: 'A Hardfork proposal',
      ownerId: 'Placeholder00',
      requestedBudget: 12345,
      pledgedAmount: 8000.02345,
      userPledged: 6000,
      initDate: new Date('2025-06-13T00:00:00.000Z'),
      expiryDate: new Date('2025-12-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Hardfork',
    },
    {
      // Partially funded, not by user

      id: '1',
      name: 'A different Hardfork proposal',
      ownerId: 'TestOwner',
      requestedBudget: 12345,
      pledgedAmount: 8000.02345,
      userPledged: 0,
      initDate: new Date('2025-06-11T00:00:00.000Z'),
      expiryDate: new Date('2025-12-13T00:00:00.000Z'),
      companyName: 'Another Company LLC',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Hardfork',
    },

    // Completed funding, user has part
    {
      id: '2',
      name: 'A Treasury proposal',
      ownerId: 'placeholder',
      requestedBudget: 12345,
      pledgedAmount: 12345,
      userPledged: 2000,
      initDate: new Date('2025-06-13T00:00:00.000Z'),
      expiryDate: new Date('2025-12-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Treasury',
    },
    {
      id: '3',
      name: 'A Treasury proposal 3',
      ownerId: 'placeholder',
      requestedBudget: 12345,
      pledgedAmount: 2000,
      userPledged: 0,
      initDate: new Date('2025-06-13T00:00:00.000Z'),
      expiryDate: new Date('2025-05-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Treasury',
    },
    {
      id: '4',
      name: 'A Treasury proposal 4',
      ownerId: 'placeholder',
      requestedBudget: 12345,
      pledgedAmount: 2000,
      userPledged: 0,
      initDate: new Date('2025-06-13T00:00:00.000Z'),
      expiryDate: new Date('2025-12-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Treasury',
    },
    {
      id: '5',
      name: 'A Hardfork proposal 88',
      ownerId: 'Sundae',
      requestedBudget: 12345,
      pledgedAmount: 8000.02345,
      userPledged: 2000,
      initDate: new Date('2025-01-13T00:00:00.000Z'),
      expiryDate: new Date('2025-05-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Hardfork',
    },
    {
      id: '5',
      name: 'A Hardfork proposal 999',
      ownerId: 'Sundae',
      requestedBudget: 12345,
      pledgedAmount: 8000.02345,
      userPledged: 2000,
      initDate: new Date('2025-01-13T00:00:00.000Z'),
      expiryDate: new Date('2025-05-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      categoryName: 'Hardfork',
    },
  ]

  const getProposalCardById = async (id: string): Promise<iProposalCardData> => {
    return data.filter((proposal) => proposal.id === id)[0]
  }

  const getProposalCategories = () => {
    const setCategories = new Set()
    for (let i = 0; i < data.length; i++) {
      setCategories.add(data[i].categoryName)
    }
    return Array.from(setCategories)
  }

  const getProposalCardsInCategory = (categoryName: string) => {
    return data.filter(
      (proposal) => proposal.categoryName.toLowerCase() === categoryName.toLowerCase()
    )
  }

  return {
    getProposalCardById,
    getProposalCardsInCategory,
    getProposalCategories,
  }
}
