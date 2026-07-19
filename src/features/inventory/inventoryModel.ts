import type { Tables } from '../../types/database'

export const INVENTORY_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'Stück',
  'Packung',
  'Dose',
  'Glas',
  'Bund',
  'Portion',
  'sonstige',
] as const

export const INVENTORY_CATEGORIES = [
  'Obst',
  'Gemüse',
  'Milchprodukte',
  'Fleisch & Fisch',
  'Getreide & Backwaren',
  'Konserven',
  'Gewürze',
  'Getränke',
  'Tiefkühlkost',
  'Sonstiges',
] as const

export type InventoryItemRow = Tables<'inventory_items'>
export type InventoryTransaction = Tables<'inventory_transactions'>
export type StorageLocation = Tables<'storage_locations'>

export type InventoryItem = InventoryItemRow & {
  storageLocationName: string
}

export type InventoryItemInput = {
  name: string
  category: string
  quantity: number
  unit: string
  storageLocationId: string
  expiresOn: string | null
  openedOn: string | null
  notes: string | null
}

export type InventoryMutationResult = {
  itemId: string
  quantity: number | null
  version: number | null
  transactionId: string
  reversibleUntil: string | null
}

export type InventoryStatus = 'loading' | 'ready' | 'error'
export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'
