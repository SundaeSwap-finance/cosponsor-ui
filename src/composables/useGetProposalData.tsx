import { iProposalCardData } from '@/types/Proposal'

export const useGetProposalCardData = async (id: string): Promise<iProposalCardData> => {
  // TODO: implement getting data from BE here.

  await setTimeout(() => {}, 1000)
  // Placeholder results below
  // \/       \/          \/
  if (id === '0') {
    // Partially funded, also by user
    return {
      id: '0',
      name: 'A Hardfork proposal',
      ownerId: 'Placeholder00',
      requestedBudget: 12345,
      pledgedAmount: 8000.02345,
      userPledged: 2000,
      initDate: new Date('2025-06-13T00:00:00.000Z'),
      expiryDate: new Date('2025-12-13T00:00:00.000Z'),
      companyName: 'Sundae Labs Inc.',
      domain: 'sundae.fi',
      abstract:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      tagName: 'Hardfork',
    }
  } else if (id === '1') {
    // Partially funded, not by user
    return {
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
      tagName: 'Hardfork',
    }
  } else if (id === '2') {
    // Completed funding, user has part
    return {
      id: '0',
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
      tagName: 'Treasury',
    }
  } else {
    // Expired
    return {
      id: '0',
      name: 'A Hardfork proposal',
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
      tagName: 'Hardfork',
    }
  }
}

export const useGetProposalFullData = () => {}
