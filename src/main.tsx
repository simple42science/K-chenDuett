import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppErrorBoundary } from './app/AppErrorBoundary'
import { ConfigurationErrorPage } from './app/ConfigurationErrorPage'
import { RootApp } from './app/RootApp'
import { AuthProvider } from './features/auth/AuthContext'
import { createAppSupabaseClient } from './lib/supabase/client'
import { readSupabaseConfig } from './lib/supabase/config'
import './styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Das Root-Element der Anwendung fehlt.')
}

const configResult = readSupabaseConfig()
const application = configResult.ok ? (
  <AuthProvider client={createAppSupabaseClient(configResult.config)}>
    <HashRouter>
      <RootApp />
    </HashRouter>
  </AuthProvider>
) : (
  <ConfigurationErrorPage missing={configResult.missing} />
)

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>{application}</AppErrorBoundary>
  </StrictMode>,
)
