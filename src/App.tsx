import { FC } from 'react'
import { Sidebar } from './components/Sidebar'

export const App: FC = () => {
  return (
    <div className={`flex flex-row min-h-screen`}>
      <Sidebar/>
      <div className="p-32">
        Page content here
      </div>
    </div>
  )
}
