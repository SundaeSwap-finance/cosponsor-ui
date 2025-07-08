import { FC, StrictMode } from 'react'
import { Sidebar } from './components/sidebar/Sidebar'
import { Providers } from '@/components/Providers'
import { Outlet } from 'react-router-dom'

export const App: FC = () => {
  return (
    <StrictMode>
      <Providers>
        <div className={`flex h-full min-h-screen w-screen flex-row`}>
          <Sidebar />
          <div className="flex h-full w-full min-w-0 pt-4 pl-4 md:pt-8 md:pl-8 lg:pt-16 lg:pl-16 xl:pt-32 xl:pl-32">
            <Outlet />
          </div>
        </div>
      </Providers>
    </StrictMode>
  )
}
