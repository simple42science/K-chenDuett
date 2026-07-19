import { App } from './App'
import { AppLoading } from './AppLoading'
import { AuthPage } from '../features/auth/AuthPage'
import { useAuth } from '../features/auth/useAuth'
import { HouseholdGate } from '../features/household/HouseholdGate'
import { InventoryProvider } from '../features/inventory/InventoryProvider'

export function RootApp() {
  const { status, error } = useAuth()

  if (status === 'loading') return <AppLoading message="Sitzung wird geladen …" />

  if (status === 'error') {
    return (
      <main className="fatal-error">
        <p className="eyebrow">Verbindung fehlgeschlagen</p>
        <h1>Die Sitzung konnte nicht geladen werden.</h1>
        <p>{error ?? 'Bitte prüfe deine Verbindung und lade die App neu.'}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Neu laden
        </button>
      </main>
    )
  }

  if (status === 'anonymous') return <AuthPage />

  return (
    <HouseholdGate>
      <InventoryProvider>
        <App />
      </InventoryProvider>
    </HouseholdGate>
  )
}
