import { iProposalCardData, iProposalDetailsData } from '@/types/Proposal'

// This file contains placeholder data for front-end visual development.

export const cardData: iProposalCardData[] = [
  // Partially funded, also by user
  {
    id: '45',
    name: 'A Hard fork proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 6000,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
  },
  {
    // Partially funded, not by user

    id: '1',
    name: 'A different Hard fork proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'ATypicalUser',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 0,
    initDate: new Date('2025-06-11T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Another Company LLC',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
  },

  // Completed funding, user has part
  {
    id: '2',
    name: 'A Treasury proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'AnotherUser',
    requestedBudget: 12345,
    pledgedAmount: 12345,
    userPledged: 2000,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
  },
  {
    id: '3',
    name: 'A Treasury proposal 3',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'User123456789',
    requestedBudget: 12345,
    pledgedAmount: 2000,
    userPledged: 0,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
  },
  {
    id: '4',
    name: 'A Treasury proposal 4',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TryoutUser',
    requestedBudget: 12345,
    pledgedAmount: 2000,
    userPledged: 0,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
  },
  {
    id: '5',
    name: 'A Hard fork proposal 88',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser1',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 2000,
    initDate: new Date('2025-01-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
  },
  {
    id: '6',
    name: 'A Hard fork proposal 999',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser2',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 2000,
    initDate: new Date('2025-01-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
  },
]

export const detailsData: iProposalDetailsData[] = [
  {
    id: '45',
    name: 'A Hard fork proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 6000,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
  {
    // Partially funded, not by user

    id: '1',
    name: 'A different Hard fork proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s23',
    ownerName: 'ATypicalUser',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 0,
    initDate: new Date('2025-06-11T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Another Company LLC',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },

  // Completed funding, user has part
  {
    id: '2',
    name: 'A Treasury proposal',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'AnotherUser',
    requestedBudget: 12345,
    pledgedAmount: 12345,
    userPledged: 2000,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
  {
    id: '3',
    name: 'A Treasury proposal 3',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'User123456789',
    requestedBudget: 12345,
    pledgedAmount: 2000,
    userPledged: 0,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
  {
    id: '4',
    name: 'A Treasury proposal 4',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TryoutUser',
    requestedBudget: 12345,
    pledgedAmount: 2000,
    userPledged: 0,
    initDate: new Date('2025-06-13T00:00:00.000Z'),
    expiryDate: new Date('2025-12-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Treasury',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
  {
    id: '5',
    name: 'A Hard fork proposal 88',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser1',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 2000,
    initDate: new Date('2025-01-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
  {
    id: '6',
    name: 'A Hard fork proposal 999',
    ownerId: 'addr1qxjavtjylrxwyunc7q9m...qnp5wfytd0872dyk2s7ch34m',
    ownerName: 'TypicalUser2',
    requestedBudget: 12345,
    pledgedAmount: 8000.02345,
    userPledged: 2000,
    initDate: new Date('2025-01-13T00:00:00.000Z'),
    expiryDate: new Date('2025-05-13T00:00:00.000Z'),
    companyName: 'Sundae Labs Inc.',
    companyDomain: 'sundae.fi',
    abstract:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    categoryName: 'Hard fork',
    companyCountry: 'The Netherlands',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    rationale:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    govActionId: '0b19476e40bbbb5e1e8ce153523762e2b6859e7ecacbaf06eae0ee6a447e79b9#0',
    cip129ActionId: 'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    pledges: [
      {
        id: 'addr1qx4qasldoiansdpiunasiuh2398745x',
        ownerName: '$HarrysHandle',
        amount: 1233.92836746234,
      },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987789', ownerName: '$HarrysHandle', amount: 456 },
      { id: 'addr1qx4qasldoiansdpiunasiuh23987213', ownerName: '$HarrysHandle', amount: 2454 },
    ],
  },
]
