import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ofertar-servico.css'
import OfertarServico from './OfertarServico'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfertarServico />
  </StrictMode>,
)
