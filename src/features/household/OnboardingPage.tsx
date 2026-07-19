import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { getFriendlyHouseholdError } from './householdErrors'
import { createHousehold, joinHousehold } from './householdService'
import { formatInvitationCode, normalizeInvitationCode } from './invitationCode'

type OnboardingMode = 'create' | 'join'

type OnboardingPageProps = {
  onReady: () => Promise<void>
}

export function OnboardingPage({ onReady }: OnboardingPageProps) {
  const { client, signOut } = useAuth()
  const [mode, setMode] = useState<OnboardingMode>('create')
  const [householdName, setHouseholdName] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchMode = (nextMode: OnboardingMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === 'create' && !householdName.trim()) {
      setError('Bitte gib eurem Haushalt einen Namen.')
      return
    }
    if (mode === 'join' && normalizeInvitationCode(invitationCode).length !== 24) {
      setError('Der Einladungscode muss 24 Zeichen enthalten.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (mode === 'create') {
        await createHousehold(client, householdName)
      } else {
        await joinHousehold(client, invitationCode)
      }
      await onReady()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Aktion fehlgeschlagen.'
      setError(getFriendlyHouseholdError(message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout onboarding-layout">
      <section className="auth-welcome">
        <span className="brand-mark large" aria-hidden="true">
          KD
        </span>
        <p className="eyebrow">Ein letzter Schritt</p>
        <h1>Wie startet euer KüchenDuett?</h1>
        <p>Erstelle euren Haushalt oder tritt mit einem einmaligen Einladungscode bei.</p>
        <button className="text-button" type="button" onClick={() => void signOut()}>
          Abmelden
        </button>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Haushalt einrichten">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'active' : ''}
            onClick={() => switchMode('create')}
          >
            Erstellen
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'join'}
            className={mode === 'join' ? 'active' : ''}
            onClick={() => switchMode('join')}
          >
            Beitreten
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {mode === 'create' ? (
            <label>
              Name des Haushalts
              <input
                autoFocus
                maxLength={80}
                value={householdName}
                onChange={(event) => setHouseholdName(event.target.value)}
                placeholder="Zum Beispiel: Zuhause"
                disabled={busy}
              />
            </label>
          ) : (
            <label>
              Einladungscode
              <input
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={29}
                value={invitationCode}
                onChange={(event) => setInvitationCode(formatInvitationCode(event.target.value))}
                placeholder="AB12-CD34-EF56-7890-AB12-CD34"
                disabled={busy}
              />
              <small>Der Code kann nur einmal verwendet werden und ist 24 Stunden gültig.</small>
            </label>
          )}

          {error && (
            <p className="form-message error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy
              ? 'Bitte warten …'
              : mode === 'create'
                ? 'Haushalt erstellen'
                : 'Einladung annehmen'}
          </button>
        </form>
      </section>
    </main>
  )
}
