import { FC } from 'react'
import { Sidebar } from './components/Sidebar'

export const App: FC = () => {
  return (
    <div className={`flex min-h-screen flex-row`}>
      <Sidebar />
      <div className="pt-32 pl-32">Page content here</div>
    </div>
  )
}
