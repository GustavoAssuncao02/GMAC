import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import './index.css'
import './landing.css'
import App from './App'
import Design2 from './Design2'

const isDesign2 = window.location.pathname.replace(/\/+$/, '').endsWith('/design2')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDesign2 ? <Design2 /> : <App />}
  </StrictMode>,
)
