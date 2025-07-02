import { createBrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import { Proposals } from '@/pages/Proposals'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // Home
        element: <Proposals />,
      },
      // {
      //   path: '/overview',
      //   element:<Proposals />,
      // },
    ],
  },
])
