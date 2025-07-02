import { createBrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import { PageProposals } from '@/pages/PageProposals'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // Home
        element: <PageProposals />,
      },
      // {
      //   path: '/overview',
      //   element:<Proposals />,
      // },
    ],
  },
])
