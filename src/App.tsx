import { StrictMode } from 'react'
import { Sidebar } from './components/sidebar/Sidebar'
import { Providers } from '@/components/Providers'
import { Outlet } from 'react-router-dom'
import { useScreenSize } from '@/composables/useScreenSize'
import { Header } from '@/components/header/Header'

export const App = () => {
  const { isMd } = useScreenSize()

  return (
    <StrictMode>
      <Providers>
        <div className={`flex min-h-screen w-full flex-col md:flex-row`}>
          {isMd ? <Sidebar /> : <Header />}
          <div className="flex h-screen w-full overflow-y-auto">
            <div className="w-full">
              <div className="sun-page-padding-t sun-page-padding-b sun-page-padding-l flex w-full">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </Providers>
    </StrictMode>
  )
}
