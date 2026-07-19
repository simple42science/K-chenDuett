import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { HouseholdGate } from './HouseholdGate'

const mocks = vi.hoisted(() => ({
  client: {},
  loadHouseholdSnapshot: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    client: mocks.client,
    user: { id: 'user-id' },
    signOut: mocks.signOut,
  }),
}))

vi.mock('./householdService', () => ({
  loadHouseholdSnapshot: mocks.loadHouseholdSnapshot,
}))

describe('Geschützter Haushaltsbereich', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt während der Prüfung einen Ladezustand', () => {
    mocks.loadHouseholdSnapshot.mockReturnValue(new Promise(() => undefined))
    render(
      <HouseholdGate>
        <p>Geschützt</p>
      </HouseholdGate>,
    )

    expect(screen.getByText('Haushalt wird geladen …')).toBeInTheDocument()
    expect(screen.queryByText('Geschützt')).not.toBeInTheDocument()
  })

  it('zeigt Fehler und ermöglicht einen neuen Versuch', async () => {
    const user = userEvent.setup()
    mocks.loadHouseholdSnapshot
      .mockRejectedValueOnce(new Error('Netzwerk nicht erreichbar'))
      .mockResolvedValueOnce(null)
    render(
      <HouseholdGate>
        <p>Geschützt</p>
      </HouseholdGate>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Der Haushalt konnte nicht geladen werden.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Netzwerk nicht erreichbar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByRole('heading', { name: 'Wie startet euer KüchenDuett?' })).toBeInTheDocument()
  })
})
