import type { Json } from '../../types/database'
import type { AppSupabaseClient } from '../../lib/supabase/client'
import type {
  InventoryItem,
  InventoryItemInput,
  InventoryMutationResult,
  InventoryTransaction,
  StorageLocation,
} from './inventoryModel'

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

function parseMutationResult(data: Json | null): InventoryMutationResult {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Supabase hat kein gültiges Änderungsergebnis geliefert.')
  }

  const itemId = data.item_id
  const transactionId = data.transaction_id
  if (typeof itemId !== 'string' || typeof transactionId !== 'string') {
    throw new Error('Supabase hat unvollständige Änderungsdaten geliefert.')
  }

  return {
    itemId,
    quantity: typeof data.quantity === 'number' ? data.quantity : null,
    version: typeof data.version === 'number' ? data.version : null,
    transactionId,
    reversibleUntil:
      typeof data.reversible_until === 'string' ? data.reversible_until : null,
  }
}

export type InventorySnapshot = {
  items: InventoryItem[]
  locations: StorageLocation[]
  transactions: InventoryTransaction[]
}

export async function loadInventorySnapshot(
  client: AppSupabaseClient,
  householdId: string,
): Promise<InventorySnapshot> {
  const [itemsResult, locationsResult, transactionsResult] = await Promise.all([
    client
      .from('inventory_items')
      .select('*')
      .eq('household_id', householdId)
      .eq('status', 'active'),
    client
      .from('storage_locations')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .order('sort_order'),
    client
      .from('inventory_transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(40),
  ])

  throwIfError(itemsResult.error)
  throwIfError(locationsResult.error)
  throwIfError(transactionsResult.error)

  const locations = locationsResult.data ?? []
  const locationNames = new Map(locations.map((location) => [location.id, location.name]))

  return {
    items: (itemsResult.data ?? []).map((item) => ({
      ...item,
      storageLocationName: locationNames.get(item.storage_location_id) ?? 'Unbekannter Lagerort',
    })),
    locations,
    transactions: transactionsResult.data ?? [],
  }
}

export async function createInventoryItem(
  client: AppSupabaseClient,
  householdId: string,
  input: InventoryItemInput,
): Promise<InventoryMutationResult> {
  const { data, error } = await client.rpc('create_inventory_item', {
    target_household_id: householdId,
    item_name: input.name,
    item_category: input.category,
    item_quantity: input.quantity,
    item_unit: input.unit,
    target_storage_location_id: input.storageLocationId,
    item_expires_on: input.expiresOn,
    item_opened_on: input.openedOn,
    item_notes: input.notes,
  })
  throwIfError(error)
  return parseMutationResult(data)
}

export async function updateInventoryItem(
  client: AppSupabaseClient,
  item: InventoryItem,
  input: InventoryItemInput,
): Promise<InventoryMutationResult> {
  const { data, error } = await client.rpc('update_inventory_item', {
    target_item_id: item.id,
    expected_version: item.version,
    item_name: input.name,
    item_category: input.category,
    item_quantity: input.quantity,
    item_unit: input.unit,
    target_storage_location_id: input.storageLocationId,
    item_expires_on: input.expiresOn,
    item_opened_on: input.openedOn,
    item_notes: input.notes,
  })
  throwIfError(error)
  return parseMutationResult(data)
}

export async function changeInventoryQuantity(
  client: AppSupabaseClient,
  item: InventoryItem,
  delta: number,
): Promise<InventoryMutationResult> {
  const { data, error } = await client.rpc('change_inventory_quantity', {
    target_item_id: item.id,
    quantity_delta: delta,
    expected_version: item.version,
  })
  throwIfError(error)
  return parseMutationResult(data)
}

export async function deleteInventoryItem(
  client: AppSupabaseClient,
  item: InventoryItem,
): Promise<InventoryMutationResult> {
  const { data, error } = await client.rpc('delete_inventory_item', {
    target_item_id: item.id,
    expected_version: item.version,
  })
  throwIfError(error)
  return parseMutationResult(data)
}

export async function mergeInventoryItems(
  client: AppSupabaseClient,
  source: InventoryItem,
  target: InventoryItem,
): Promise<InventoryMutationResult> {
  const { data, error } = await client.rpc('merge_inventory_items', {
    source_item_id: source.id,
    source_expected_version: source.version,
    target_item_id: target.id,
    target_expected_version: target.version,
  })
  throwIfError(error)
  return parseMutationResult(data)
}

export async function undoInventoryTransaction(
  client: AppSupabaseClient,
  transactionId: string,
): Promise<void> {
  const { error } = await client.rpc('undo_inventory_transaction', {
    target_transaction_id: transactionId,
  })
  throwIfError(error)
}

export function getFriendlyInventoryError(message: string): string {
  if (/zwischenzeitlich geändert|serialization/i.test(message)) {
    return 'Der Bestand wurde auf einem anderen Gerät geändert. Die Liste wurde neu geladen.'
  }
  if (/Rückgängig-Zeitfenster.*abgelaufen/i.test(message)) {
    return 'Die zehn Sekunden zum Rückgängigmachen sind abgelaufen.'
  }
  if (/Menge.*nicht negativ/i.test(message)) return 'Die Menge kann nicht unter null fallen.'
  if (/duplicate|unique/i.test(message)) return 'Dieser Eintrag ist bereits vorhanden.'
  return message
}
