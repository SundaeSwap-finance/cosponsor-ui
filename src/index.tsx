import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './css/index.css'
import { router } from '@/Router'

// Suppress React 19 forwardRef warning from cmdk/Radix UI libraries
// TODO: Remove when libraries are updated for React 19 compatibility
const originalError = console.error
console.error = (...args) => {
  if (args[0]?.includes?.('forwardRef render functions')) {
    return
  }
  originalError.apply(console, args)
}

const container = document.querySelector('#app')
if (container) {
  const root = createRoot(container)
  root.render(<RouterProvider router={router} />)
}
