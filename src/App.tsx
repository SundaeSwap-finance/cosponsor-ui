import { FC, StrictMode } from 'react'
import { Sidebar } from './components/sidebar/Sidebar'
import { Providers } from '@/components/Providers'
import { Outlet } from 'react-router-dom'

export const App: FC = () => {
  return (
    <StrictMode>
      <Providers>
        <div className={`flex min-h-screen w-full flex-row`}>
          <Sidebar />
          <div className="h-full w-full pt-32 pl-32">
            <Outlet />
          </div>
        </div>
      </Providers>
    </StrictMode>
  )
}
