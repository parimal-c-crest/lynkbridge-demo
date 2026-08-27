import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { DataProvider } from '@/state/DataContext'
import { SessionProvider } from '@/state/SessionContext'
import { SettingsProvider } from '@/state/SettingsContext'
import { ToastProvider } from '@/state/ToastContext'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <SessionProvider>
            <DataProvider>
              <ScrollToTop />
              <App />
            </DataProvider>
          </SessionProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
