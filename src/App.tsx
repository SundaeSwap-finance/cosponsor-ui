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
              <div className="flex w-full pt-4 pl-4 lg:pt-8 lg:pl-8 xl:pt-16 xl:pl-16">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </Providers>
    </StrictMode>
  )
}
