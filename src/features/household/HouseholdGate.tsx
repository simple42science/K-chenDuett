import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AppLoading } from '../../app/AppLoading'
import { useAuth } from '../auth/useAuth'
import { HouseholdProvider } from './HouseholdContext'
import { loadHouseholdSnapshot, type HouseholdSnapshot } from './householdService'
import { OnboardingPage } from './OnboardingPage'

type HouseholdGateProps = {
  children: ReactNode
}

export function HouseholdGate({ children }: HouseholdGateProps) {
  const { client, user } = useAuth()
  const userId = user?.id
  const [household, setHousehold] = useState<HouseholdSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshHousehold = useCallback(async () => {
    if (!userId) return
    try {
      const nextHousehold = await loadHouseholdSnapshot(client, userId)
      setHousehold(nextHousehold)
      setError(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Haushalt konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [client, userId])

  useEffect(() => {
    if (!userId) return
    let active = true

    void loadHouseholdSnapshot(client, userId)
      .then((nextHousehold) => {
        if (!active) return
        setHousehold(nextHousehold)
        setError(null)
      })
      .catch((caughtError: unknown) => {
        if (!active) return
        setError(
          caughtError instanceof Error ? caughtError.message : 'Haushalt konnte nicht geladen werden.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [client, userId])

  useEffect(() => {
    const handleFocus = () => void refreshHousehold()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshHousehold])

  if (loading) return <AppLoading message="Haushalt wird geladen …" />

  if (error) {
    return (
      <main className="fatal-error">
        <p className="eyebrow">Verbindung fehlgeschlagen</p>
        <h1>Der Haushalt konnte nicht geladen werden.</h1>
        <p>{error}</p>
        <button type="button" onClick={() => void refreshHousehold()}>
          Erneut versuchen
        </button>
      </main>
    )
  }

  if (!household) return <OnboardingPage onReady={refreshHousehold} />

  return (
    <HouseholdProvider household={household} refreshHousehold={refreshHousehold}>
      {children}
    </HouseholdProvider>
  )
}
