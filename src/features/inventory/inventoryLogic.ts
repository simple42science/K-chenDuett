import type { InventoryItem } from './inventoryModel'

export type ExpiryKind = 'none' | 'expired' | 'today' | 'soon' | 'later'

export type ExpiryInfo = {
  kind: ExpiryKind
  days: number | null
  label: string
}

function localDateValue(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getExpiryInfo(expiresOn: string | null, today = new Date()): ExpiryInfo {
  if (!expiresOn) return { kind: 'none', days: null, label: 'Kein Ablaufdatum' }
  const [year, month, day] = expiresOn.split('-').map(Number)
  const expiryValue = Date.UTC(year, month - 1, day)
  const days = Math.round((expiryValue - localDateValue(today)) / 86_400_000)

  if (days < 0) return { kind: 'expired', days, label: `Seit ${Math.abs(days)} T. abgelaufen` }
  if (days === 0) return { kind: 'today', days, label: 'Läuft heute ab' }
  if (days <= 3) return { kind: 'soon', days, label: `Noch ${days} T.` }
  return { kind: 'later', days, label: new Intl.DateTimeFormat('de-CH').format(new Date(expiryValue)) }
}

export function getQuantityStep(unit: string): number {
  if (unit === 'g' || unit === 'ml') return 100
  if (unit === 'kg' || unit === 'l') return 0.1
  return 1
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 3 }).format(quantity)} ${unit}`
}

export type InventoryFilters = {
  search: string
  category: string
  storageLocationId: string
  expiry: 'all' | 'soon' | 'expired' | 'without'
}

export function filterInventoryItems(
  items: InventoryItem[],
  filters: InventoryFilters,
  today = new Date(),
): InventoryItem[] {
  const search = filters.search.trim().toLocaleLowerCase('de-CH')

  return items
    .filter((item) => {
      const expiry = getExpiryInfo(item.expires_on, today)
      return (
        (!search ||
          item.name.toLocaleLowerCase('de-CH').includes(search) ||
          item.category.toLocaleLowerCase('de-CH').includes(search) ||
          item.storageLocationName.toLocaleLowerCase('de-CH').includes(search)) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.storageLocationId || item.storage_location_id === filters.storageLocationId) &&
        (filters.expiry === 'all' ||
          (filters.expiry === 'soon' && ['today', 'soon'].includes(expiry.kind)) ||
          (filters.expiry === 'expired' && expiry.kind === 'expired') ||
          (filters.expiry === 'without' && expiry.kind === 'none'))
      )
    })
    .sort((left, right) => {
      if (!left.expires_on && right.expires_on) return 1
      if (left.expires_on && !right.expires_on) return -1
      if (left.expires_on && right.expires_on) {
        const expiryOrder = left.expires_on.localeCompare(right.expires_on)
        if (expiryOrder !== 0) return expiryOrder
      }
      return left.name.localeCompare(right.name, 'de-CH')
    })
}

export function isMergeCandidate(source: InventoryItem, target: InventoryItem): boolean {
  return (
    source.id !== target.id &&
    source.normalized_name === target.normalized_name &&
    source.unit === target.unit
  )
}
