import { createBrowserRouter, redirect } from 'react-router-dom'
import { App } from '@/App'
import { PageProposalsAll } from '@/pages/PageProposalsAll'
import { PageProposalsCategory } from '@/pages/PageProposalsCategory'
import { PageProposalsUserPledge } from '@/pages/PageProposalsUserPledge'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // Home
        loader: () => redirect('/all'),
      },
      {
        path: '/all',
        element: <PageProposalsAll />,
      },
      {
        path: '/category/:name',
        element: <PageProposalsCategory />,
      },
      {
        path: '/your',
        element: <PageProposalsUserPledge />,
      },
    ],
  },
])
