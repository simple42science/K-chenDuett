import { useState, type FormEvent } from 'react'
import { PageIntro } from '../../components/PageIntro'
import { useAuth } from '../auth/useAuth'
import { useHousehold } from '../household/useHousehold'
import {
  createInvitation,
  updateDisplayName,
  type CreatedInvitation,
} from '../household/householdService'

export function MorePage() {
  const { client, user, signOut } = useAuth()
  const { household, refreshHousehold } = useHousehold()
  const currentMember = household.members.find((member) => member.userId === user?.id)
  const [displayName, setDisplayName] = useState(currentMember?.displayName ?? '')
  const [invitation, setInvitation] = useState<CreatedInvitation | null>(null)
  const [busy, setBusy] = useState<'profile' | 'invite' | 'logout' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || displayName.trim().length < 2) {
      setError('Der Anzeigename benötigt mindestens 2 Zeichen.')
      return
    }

    setBusy('profile')
    setError(null)
    setMessage(null)
    try {
      await updateDisplayName(client, user.id, displayName)
      await refreshHousehold()
      setMessage('Profil gespeichert.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Profil konnte nicht gespeichert werden.')
    } finally {
      setBusy(null)
    }
  }

  const generateInvitation = async () => {
    setBusy('invite')
    setError(null)
    setMessage(null)
    try {
      setInvitation(await createInvitation(client, household.id))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Einladung konnte nicht erstellt werden.')
    } finally {
      setBusy(null)
    }
  }

  const copyInvitation = async () => {
    if (!invitation) return
    try {
      await navigator.clipboard.writeText(invitation.code)
      setMessage('Einladungscode kopiert.')
    } catch {
      setError('Der Code konnte nicht kopiert werden. Bitte markiere ihn manuell.')
    }
  }

  const logout = async () => {
    setBusy('logout')
    setError(null)
    try {
      await signOut()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Abmelden fehlgeschlagen.')
      setBusy(null)
    }
  }

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Einstellungen"
        title="Mehr"
        description="Profil, gemeinsamer Haushalt und sichere Anmeldung verwalten."
      />

      {(message || error) && (
        <p className={`form-message ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
          {error ?? message}
        </p>
      )}

      <section className="settings-card" aria-labelledby="profile-title">
        <div>
          <p className="eyebrow">Dein Konto</p>
          <h2 id="profile-title">Profil</h2>
          <p className="muted-text">{user?.email}</p>
        </div>
        <form className="inline-form" onSubmit={saveProfile}>
          <label>
            Anzeigename
            <input
              value={displayName}
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={busy !== null}
            />
          </label>
          <button className="secondary-button" type="submit" disabled={busy !== null}>
            {busy === 'profile' ? 'Speichert …' : 'Speichern'}
          </button>
        </form>
      </section>

      <section className="settings-card" aria-labelledby="household-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gemeinsam</p>
            <h2 id="household-title">{household.name}</h2>
          </div>
          <span className="member-count">{household.members.length}/2 Mitglieder</span>
        </div>

        <ul className="member-list">
          {household.members.map((member) => (
            <li key={member.userId}>
              <span className="member-avatar" aria-hidden="true">
                {member.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{member.displayName}</strong>
                {member.userId === user?.id && <small>Du</small>}
              </span>
            </li>
          ))}
        </ul>

        {household.members.length < 2 && (
          <div className="invitation-panel">
            <p>Lade die zweite Person mit einem einmaligen Code ein.</p>
            {invitation ? (
              <>
                <code className="invitation-code">{invitation.code}</code>
                <small>
                  Gültig bis{' '}
                  {new Intl.DateTimeFormat('de-CH', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(invitation.expiresAt))}
                </small>
                <button className="secondary-button" type="button" onClick={() => void copyInvitation()}>
                  Code kopieren
                </button>
              </>
            ) : (
              <button
                className="secondary-button"
                type="button"
                disabled={busy !== null}
                onClick={() => void generateInvitation()}
              >
                {busy === 'invite' ? 'Erstellt …' : 'Einladungscode erstellen'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="settings-card danger-zone" aria-labelledby="session-title">
        <div>
          <p className="eyebrow">Sitzung</p>
          <h2 id="session-title">Auf diesem Gerät abmelden</h2>
        </div>
        <button
          className="text-button danger"
          type="button"
          disabled={busy !== null}
          onClick={() => void logout()}
        >
          {busy === 'logout' ? 'Meldet ab …' : 'Abmelden'}
        </button>
      </section>
    </div>
  )
}
