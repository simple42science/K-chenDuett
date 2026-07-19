import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { InventoryPage } from './InventoryPage'
import type { InventoryContextValue } from './inventoryContextStore'
import type { InventoryItem } from './inventoryModel'

const item: InventoryItem = {
  id: 'item-1', household_id: 'household-1', name: 'Milch', normalized_name: 'milch', category: 'Milchprodukte',
  quantity: 1, unit: 'l', storage_location_id: 'fridge', storageLocationName: 'Kühlschrank', expires_on: null,
  opened_on: null, notes: null, status: 'active', consumed_at: null, version: 1, created_by: 'user-1',
  updated_by: 'user-1', created_at: '2026-07-19T10:00:00Z', updated_at: '2026-07-19T10:00:00Z',
}

const mocks = vi.hoisted(() => ({ changeQuantity: vi.fn(), refreshInventory: vi.fn() }))

const inventory: InventoryContextValue = {
  items: [item], locations: [{ id: 'fridge', household_id: 'household-1', name: 'Kühlschrank', is_active: true, sort_order: 1, created_at: '', updated_at: '' }],
  transactions: [], status: 'ready', realtimeStatus: 'connected', error: null,
  refreshInventory: mocks.refreshInventory,
  createItem: vi.fn(), updateItem: vi.fn(), changeQuantity: mocks.changeQuantity,
  deleteItem: vi.fn(), mergeItems: vi.fn(), undoTransaction: vi.fn(),
}

vi.mock('../household/useHousehold', () => ({ useHousehold: () => ({ household: { id: 'household-1', name: 'Zuhause' } }) }))
vi.mock('./useInventory', () => ({ useInventory: () => inventory }))

describe('Inventarseite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.changeQuantity.mockResolvedValue({ itemId: item.id, quantity: 1.1, version: 2, transactionId: 'tx-1', reversibleUntil: new Date(Date.now() + 10_000).toISOString() })
  })

  it('zeigt Bestand und filtert ohne Serveranfrage', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)
    expect(screen.getByRole('heading', { name: 'Milch' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Lebensmittel suchen …'), 'Reis')
    expect(screen.getByRole('heading', { name: 'Keine Treffer' })).toBeInTheDocument()
  })

  it('ändert Mengen atomar und bietet Undo an', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)
    await user.click(screen.getByRole('button', { name: 'Milch erhöhen' }))
    expect(mocks.changeQuantity).toHaveBeenCalledWith(item, 0.1)
    expect(await screen.findByRole('button', { name: /Rückgängig/ })).toBeInTheDocument()
  })
})
