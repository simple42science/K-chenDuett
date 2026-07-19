import { createContext } from 'react'
import type {
  InventoryItem,
  InventoryItemInput,
  InventoryMutationResult,
  InventoryStatus,
  InventoryTransaction,
  RealtimeStatus,
  StorageLocation,
} from './inventoryModel'

export type InventoryContextValue = {
  items: InventoryItem[]
  locations: StorageLocation[]
  transactions: InventoryTransaction[]
  status: InventoryStatus
  realtimeStatus: RealtimeStatus
  error: string | null
  refreshInventory: () => Promise<void>
  createItem: (input: InventoryItemInput) => Promise<InventoryMutationResult>
  updateItem: (item: InventoryItem, input: InventoryItemInput) => Promise<InventoryMutationResult>
  changeQuantity: (item: InventoryItem, delta: number) => Promise<InventoryMutationResult>
  deleteItem: (item: InventoryItem) => Promise<InventoryMutationResult>
  mergeItems: (source: InventoryItem, target: InventoryItem) => Promise<InventoryMutationResult>
  undoTransaction: (transactionId: string) => Promise<void>
}

export const InventoryContext = createContext<InventoryContextValue | undefined>(undefined)
