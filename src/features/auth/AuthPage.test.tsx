import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    client: {
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signUp: mocks.signUp,
      },
    },
  }),
}))

describe('Anmeldung', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prüft das starke Passwort bereits vor Supabase', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByRole('tab', { name: 'Registrieren' }))
    await user.type(screen.getByLabelText('Anzeigename'), 'Anna')
    await user.type(screen.getByLabelText('E-Mail-Adresse'), 'anna@example.com')
    await user.type(screen.getAllByLabelText(/Passwort/)[0], 'zu-schwach')
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'zu-schwach')
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(screen.getByRole('alert')).toHaveTextContent('mindestens 12 Zeichen')
    expect(mocks.signUp).not.toHaveBeenCalled()
  })

  it('zeigt nach Registrierung die E-Mail-Bestätigung', async () => {
    const user = userEvent.setup()
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })
    render(<AuthPage />)

    await user.click(screen.getByRole('tab', { name: 'Registrieren' }))
    await user.type(screen.getByLabelText('Anzeigename'), 'Anna')
    await user.type(screen.getByLabelText('E-Mail-Adresse'), 'anna@example.com')
    await user.type(screen.getAllByLabelText(/Passwort/)[0], 'SehrSicher12!')
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'SehrSicher12!')
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(await screen.findByRole('heading', { name: 'E-Mail bestätigen' })).toBeInTheDocument()
    expect(screen.getByText('anna@example.com')).toBeInTheDocument()
    expect(mocks.signUp).toHaveBeenCalledOnce()
  })
})
