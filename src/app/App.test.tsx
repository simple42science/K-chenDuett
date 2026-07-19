import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HouseholdProvider } from '../features/household/HouseholdContext'
import type { HouseholdSnapshot } from '../features/household/householdService'
import { InventoryContext, type InventoryContextValue } from '../features/inventory/inventoryContextStore'
import { App } from './App'

const household: HouseholdSnapshot = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Testhaushalt',
  createdAt: '2026-07-19T10:00:00.000Z',
  members: [],
}

const inventory: InventoryContextValue = {
  items: [], locations: [], transactions: [], status: 'ready', realtimeStatus: 'connected', error: null,
  refreshInventory: async () => undefined,
  createItem: async () => { throw new Error('Nicht im App-Test verwendet') },
  updateItem: async () => { throw new Error('Nicht im App-Test verwendet') },
  changeQuantity: async () => { throw new Error('Nicht im App-Test verwendet') },
  deleteItem: async () => { throw new Error('Nicht im App-Test verwendet') },
  mergeItems: async () => { throw new Error('Nicht im App-Test verwendet') },
  undoTransaction: async () => undefined,
}

function renderApp() {
  return render(
    <HouseholdProvider household={household} refreshHousehold={async () => undefined}>
      <InventoryContext.Provider value={inventory}>
        <MemoryRouter><App /></MemoryRouter>
      </InventoryContext.Provider>
    </HouseholdProvider>,
  )
}

describe('App', () => {
  it('zeigt die mobile Startansicht', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Was kochen wir heute?' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument()
  })

  it('wechselt über die Hauptnavigation zum Inventar', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: /Inventar/i }))

    expect(screen.getByRole('heading', { name: 'Inventar' })).toBeInTheDocument()
  })
})
