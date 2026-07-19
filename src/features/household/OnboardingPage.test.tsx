import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { OnboardingPage } from './OnboardingPage'

const mocks = vi.hoisted(() => ({
  createHousehold: vi.fn(),
  joinHousehold: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ client: {}, signOut: mocks.signOut }),
}))

vi.mock('./householdService', () => ({
  createHousehold: mocks.createHousehold,
  joinHousehold: mocks.joinHousehold,
}))

describe('Haushalts-Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('erstellt einen Haushalt und lädt den geschützten Bereich', async () => {
    const user = userEvent.setup()
    const onReady = vi.fn().mockResolvedValue(undefined)
    mocks.createHousehold.mockResolvedValue('household-id')
    render(<OnboardingPage onReady={onReady} />)

    await user.type(screen.getByLabelText('Name des Haushalts'), 'Zuhause')
    await user.click(screen.getByRole('button', { name: 'Haushalt erstellen' }))

    expect(mocks.createHousehold).toHaveBeenCalledWith({}, 'Zuhause')
    expect(onReady).toHaveBeenCalledOnce()
  })

  it('zeigt eine abgelaufene Einladung verständlich an', async () => {
    const user = userEvent.setup()
    mocks.joinHousehold.mockRejectedValue(new Error('Einladung ist ungültig oder abgelaufen'))
    render(<OnboardingPage onReady={vi.fn()} />)

    await user.click(screen.getByRole('tab', { name: 'Beitreten' }))
    await user.type(screen.getByLabelText(/Einladungscode/), 'AB12CD34EF567890AB12CD34')
    await user.click(screen.getByRole('button', { name: 'Einladung annehmen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Diese Einladung ist ungültig, wurde bereits verwendet oder ist abgelaufen.',
    )
  })
})
