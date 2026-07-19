import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { useHousehold } from '../household/useHousehold'
import { InventoryContext, type InventoryContextValue } from './inventoryContextStore'
import type {
  InventoryItem,
  InventoryStatus,
  InventoryTransaction,
  RealtimeStatus,
  StorageLocation,
} from './inventoryModel'
import {
  changeInventoryQuantity,
  createInventoryItem,
  deleteInventoryItem,
  loadInventorySnapshot,
  mergeInventoryItems,
  undoInventoryTransaction,
  updateInventoryItem,
} from './inventoryService'

type InventoryProviderProps = {
  children: ReactNode
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const { client } = useAuth()
  const { household } = useHousehold()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [status, setStatus] = useState<InventoryStatus>('loading')
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const refreshTimer = useRef<number | null>(null)

  const refreshInventory = useCallback(async () => {
    try {
      const snapshot = await loadInventorySnapshot(client, household.id)
      setItems(snapshot.items)
      setLocations(snapshot.locations)
      setTransactions(snapshot.transactions)
      setError(null)
      setStatus('ready')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Inventar konnte nicht geladen werden.')
      setStatus('error')
    }
  }, [client, household.id])

  useEffect(() => {
    let active = true
    void loadInventorySnapshot(client, household.id)
      .then((snapshot) => {
        if (!active) return
        setItems(snapshot.items)
        setLocations(snapshot.locations)
        setTransactions(snapshot.transactions)
        setError(null)
        setStatus('ready')
      })
      .catch((caughtError: unknown) => {
        if (!active) return
        setError(caughtError instanceof Error ? caughtError.message : 'Inventar konnte nicht geladen werden.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [client, household.id])

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
      refreshTimer.current = window.setTimeout(() => void refreshInventory(), 120)
    }

    const channel = client
      .channel(`inventory:${household.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items', filter: `household_id=eq.${household.id}` },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_transactions',
          filter: `household_id=eq.${household.id}`,
        },
        scheduleRefresh,
      )
      .subscribe((nextStatus) => {
        setRealtimeStatus(nextStatus === 'SUBSCRIBED' ? 'connected' : nextStatus === 'CHANNEL_ERROR' ? 'disconnected' : 'connecting')
      })

    return () => {
      if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
      void client.removeChannel(channel)
    }
  }, [client, household.id, refreshInventory])

  const runAndRefresh = useCallback(
    async <Result,>(operation: () => Promise<Result>): Promise<Result> => {
      try {
        return await operation()
      } finally {
        await refreshInventory()
      }
    },
    [refreshInventory],
  )

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      locations,
      transactions,
      status,
      realtimeStatus,
      error,
      refreshInventory,
      createItem: (input) =>
        runAndRefresh(() => createInventoryItem(client, household.id, input)),
      updateItem: (item, input) => runAndRefresh(() => updateInventoryItem(client, item, input)),
      changeQuantity: (item, delta) =>
        runAndRefresh(() => changeInventoryQuantity(client, item, delta)),
      deleteItem: (item) => runAndRefresh(() => deleteInventoryItem(client, item)),
      mergeItems: (source, target) =>
        runAndRefresh(() => mergeInventoryItems(client, source, target)),
      undoTransaction: (transactionId) =>
        runAndRefresh(() => undoInventoryTransaction(client, transactionId)),
    }),
    [
      client,
      error,
      household.id,
      items,
      locations,
      realtimeStatus,
      refreshInventory,
      runAndRefresh,
      status,
      transactions,
    ],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
