import { createRoot } from 'react-dom/client'

import { App } from './App'
import './css/index.css'
import { Providers } from './Providers'

const container = document.querySelector('#app')
if (container) {
  const root = createRoot(container)
  root.render(
    <Providers>
      <App />
    </Providers>
  )
}
