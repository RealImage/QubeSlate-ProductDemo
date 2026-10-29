import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SlateProvider } from '@slate/api'
// Legacy design-system CSS first; @slate/ui (prefab SCSS + Slate layer) after it so the new tokens win.
import './index.css'
import '@slate/ui'
import App from './App.tsx'
import { AppStateProvider } from './state/AppStateContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SlateProvider portal="sac">
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </SlateProvider>
    </BrowserRouter>
  </StrictMode>,
)
