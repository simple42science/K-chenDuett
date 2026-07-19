import { useContext } from 'react'
import { InventoryContext, type InventoryContextValue } from './inventoryContextStore'

export function useInventory(): InventoryContextValue {
  const value = useContext(InventoryContext)
  if (!value) throw new Error('useInventory muss innerhalb des InventoryProvider verwendet werden.')
  return value
}
