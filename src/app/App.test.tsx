import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'

describe('App', () => {
  it('zeigt die mobile Startansicht', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Was kochen wir heute?' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument()
  })

  it('wechselt über die Hauptnavigation zum Inventar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: /Inventar/i }))

    expect(screen.getByRole('heading', { name: 'Inventar' })).toBeInTheDocument()
  })
})
