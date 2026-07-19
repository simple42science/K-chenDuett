import { useState, type FormEvent } from 'react'
import { getAuthRedirectUrl } from '../../lib/supabase/config'
import { useAuth } from './useAuth'
import { getFriendlyAuthError } from './authErrors'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const { client } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
    setPendingEmail(null)
  }

  const validate = (): string | null => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
    if (
      password.length < 12 ||
      !/[a-zäöü]/.test(password) ||
      !/[A-ZÄÖÜ]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-zÄÖÜäöü0-9]/.test(password)
    ) {
      return 'Das Passwort benötigt mindestens 12 Zeichen sowie Klein- und Grossbuchstaben, Zahl und Sonderzeichen.'
    }
    if (mode === 'register' && displayName.trim().length < 2) {
      return 'Der Anzeigename benötigt mindestens 2 Zeichen.'
    }
    if (mode === 'register' && password !== passwordConfirmation) {
      return 'Die beiden Passwörter stimmen nicht überein.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    setError(null)
    setPendingEmail(null)

    try {
      if (mode === 'login') {
        const { error: loginError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (loginError) throw loginError
      } else {
        const { data, error: registrationError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: getAuthRedirectUrl(),
          },
        })
        if (registrationError) throw registrationError
        if (!data.session) setPendingEmail(email.trim())
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Anmeldung fehlgeschlagen.'
      setError(getFriendlyAuthError(message))
    } finally {
      setBusy(false)
    }
  }

  if (pendingEmail) {
    return (
      <main className="auth-layout">
        <section className="auth-card auth-success" aria-live="polite">
          <span className="auth-logo" aria-hidden="true">
            ✓
          </span>
          <p className="eyebrow">Fast geschafft</p>
          <h1>E-Mail bestätigen</h1>
          <p>
            Wir haben einen Bestätigungslink an <strong>{pendingEmail}</strong> gesendet. Öffne ihn
            auf diesem Gerät und melde dich danach an.
          </p>
          <button className="primary-button" type="button" onClick={() => switchMode('login')}>
            Zur Anmeldung
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-layout">
      <section className="auth-welcome">
        <span className="brand-mark large" aria-hidden="true">
          KD
        </span>
        <p className="eyebrow">Gemeinsam besser verwerten</p>
        <h1>Eure Küche. Ein gemeinsamer Überblick.</h1>
        <p>Vorräte teilen, Ablaufdaten sehen und mit dem kochen, was bereits zuhause ist.</p>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Konto">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Anmelden
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Registrieren
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <label>
              Anzeigename
              <input
                autoComplete="name"
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Dein Name"
                disabled={busy}
              />
            </label>
          )}

          <label>
            E-Mail-Adresse
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.ch"
              disabled={busy}
            />
          </label>

          <label>
            Passwort
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
            {mode === 'register' && (
              <small>Mindestens 12 Zeichen mit Klein- und Grossbuchstaben, Zahl und Sonderzeichen.</small>
            )}
          </label>

          {mode === 'register' && (
            <label>
              Passwort wiederholen
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                disabled={busy}
              />
            </label>
          )}

          {error && (
            <p className="form-message error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Bitte warten …' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>
      </section>
    </main>
  )
}
