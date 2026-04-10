import { createBrowserRouter, redirect } from 'react-router-dom'
import { App } from '@/App'
import { PageProposalsAll } from '@/pages/PageProposalsAll'
import { PageProposalsCategory } from '@/pages/PageProposalsCategory'
import { PageProposalsUserPledge } from '@/pages/PageProposalsUserPledge'
import { PageProposalDetails } from '@/pages/PageProposalDetails'
import { PageAbout } from '@/pages/PageAbout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // Home
        loader: () => redirect('/all-proposals'),
      },
      {
        path: '/all-proposals',
        element: <PageProposalsAll />,
      },
      {
        path: '/category/:name',
        element: <PageProposalsCategory />,
      },
      {
        path: '/your-pledges',
        element: <PageProposalsUserPledge />,
      },
      {
        path: '/proposal/:proposalId',
        element: <PageProposalDetails />,
      },
      {
        path: '/about',
        element: <PageAbout />,
      },
    ],
  },
])
