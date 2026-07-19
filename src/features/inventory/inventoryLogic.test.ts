import { filterInventoryItems, getExpiryInfo, getQuantityStep, isMergeCandidate } from './inventoryLogic'
import type { InventoryItem } from './inventoryModel'

const baseItem: InventoryItem = {
  id: 'item-1', household_id: 'household-1', name: 'Milch', normalized_name: 'milch',
  category: 'Milchprodukte', quantity: 1, unit: 'l', storage_location_id: 'fridge',
  storageLocationName: 'Kühlschrank', expires_on: '2026-07-21', opened_on: null, notes: null,
  status: 'active', consumed_at: null, version: 1, created_by: 'user-1', updated_by: 'user-1',
  created_at: '2026-07-19T10:00:00Z', updated_at: '2026-07-19T10:00:00Z',
}

describe('Inventar-Fachlogik', () => {
  it('klassifiziert Ablaufdaten auf Kalendertagbasis', () => {
    const today = new Date(2026, 6, 19, 18, 30)
    expect(getExpiryInfo('2026-07-18', today).kind).toBe('expired')
    expect(getExpiryInfo('2026-07-19', today).kind).toBe('today')
    expect(getExpiryInfo('2026-07-22', today).kind).toBe('soon')
    expect(getExpiryInfo(null, today).kind).toBe('none')
  })

  it('verwendet alltagstaugliche Mengenschritte', () => {
    expect(getQuantityStep('g')).toBe(100)
    expect(getQuantityStep('kg')).toBe(0.1)
    expect(getQuantityStep('Stück')).toBe(1)
  })

  it('filtert über Name, Kategorie, Lagerort und Ablauf', () => {
    const result = filterInventoryItems(
      [baseItem, { ...baseItem, id: 'item-2', name: 'Reis', normalized_name: 'reis', category: 'Getreide & Backwaren', expires_on: null, storage_location_id: 'pantry', storageLocationName: 'Vorratsschrank' }],
      { search: 'kühl', category: 'Milchprodukte', storageLocationId: 'fridge', expiry: 'soon' },
      new Date(2026, 6, 19),
    )
    expect(result.map((item) => item.name)).toEqual(['Milch'])
  })

  it('erkennt nur gleiche Namen und Einheiten als zusammenführbar', () => {
    expect(isMergeCandidate(baseItem, { ...baseItem, id: 'item-2' })).toBe(true)
    expect(isMergeCandidate(baseItem, { ...baseItem, id: 'item-2', unit: 'ml' })).toBe(false)
    expect(isMergeCandidate(baseItem, baseItem)).toBe(false)
  })
})
