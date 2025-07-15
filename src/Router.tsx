import { createBrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import { PageProposalsAll } from '@/pages/PageProposalsAll'
import { PageProposalsCategory } from '@/pages/PageProposalsCategory'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // Home
        element: <PageProposalsAll />,
      },
      {
        index: false,
        path: '/overview',
        element: <PageProposalsAll />,
      },
      {
        index: false,
        path: '/category/:name',
        element: <PageProposalsCategory />,
      },
    ],
  },
])
