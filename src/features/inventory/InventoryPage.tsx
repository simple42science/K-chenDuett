import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { PageIntro } from '../../components/PageIntro'
import { useHousehold } from '../household/useHousehold'
import { InventoryForm } from './InventoryForm'
import {
  filterInventoryItems,
  formatQuantity,
  getExpiryInfo,
  getQuantityStep,
  isMergeCandidate,
} from './inventoryLogic'
import { INVENTORY_CATEGORIES, type InventoryItem, type InventoryItemInput, type InventoryMutationResult } from './inventoryModel'
import { getFriendlyInventoryError } from './inventoryService'
import { UndoToast } from './UndoToast'
import { useInventory } from './useInventory'

type UndoState = { transactionId: string; expiresAt: string; label: string }

const actionLabels: Record<string, string> = {
  create: 'hinzugefügt', update: 'bearbeitet', increase: 'erhöht', decrease: 'reduziert',
  consume: 'verbraucht', delete: 'gelöscht', restore: 'wiederhergestellt', merge: 'zusammengeführt',
}

export function InventoryPage() {
  const { household } = useHousehold()
  const inventory = useInventory()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [storageLocationId, setStorageLocationId] = useState('')
  const [expiry, setExpiry] = useState<'all' | 'soon' | 'expired' | 'without'>('all')
  const [editingItem, setEditingItem] = useState<InventoryItem | null | undefined>(undefined)
  const [mergingItem, setMergingItem] = useState<InventoryItem | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)

  const visibleItems = useMemo(
    () => filterInventoryItems(inventory.items, { search, category, storageLocationId, expiry }),
    [category, expiry, inventory.items, search, storageLocationId],
  )

  const rememberUndo = (result: InventoryMutationResult, label: string) => {
    if (result.reversibleUntil) {
      setUndo({ transactionId: result.transactionId, expiresAt: result.reversibleUntil, label })
    } else setUndo(null)
  }

  const runMutation = async (
    key: string,
    operation: () => Promise<InventoryMutationResult>,
    label: string,
  ): Promise<boolean> => {
    setBusy(key)
    setError(null)
    try {
      rememberUndo(await operation(), label)
      return true
    } catch (caughtError) {
      setError(getFriendlyInventoryError(caughtError instanceof Error ? caughtError.message : 'Aktion fehlgeschlagen.'))
      await inventory.refreshInventory()
      return false
    } finally {
      setBusy(null)
    }
  }

  const saveItem = async (input: InventoryItemInput) => {
    const item = editingItem ?? null
    const saved = await runMutation(
      item ? `edit:${item.id}` : 'create',
      () => item ? inventory.updateItem(item, input) : inventory.createItem(input),
      item ? `${input.name} wurde bearbeitet.` : `${input.name} wurde hinzugefügt.`,
    )
    if (saved) setEditingItem(undefined)
  }

  const expireUndo = useCallback(() => setUndo(null), [])

  const undoLastAction = async () => {
    if (!undo) return
    setBusy('undo')
    try {
      await inventory.undoTransaction(undo.transactionId)
      setUndo(null)
    } catch (caughtError) {
      setError(getFriendlyInventoryError(caughtError instanceof Error ? caughtError.message : 'Rückgängig fehlgeschlagen.'))
    } finally {
      setBusy(null)
    }
  }

  if (inventory.status === 'loading') {
    return <div className="inventory-loading" aria-busy="true">Inventar wird geladen …</div>
  }

  if (inventory.status === 'error') {
    return (
      <EmptyState icon="!" title="Inventar konnte nicht geladen werden">
        {inventory.error ?? 'Bitte prüfe deine Verbindung.'}
        <button className="secondary-button" type="button" onClick={() => void inventory.refreshInventory()}>Erneut versuchen</button>
      </EmptyState>
    )
  }

  return (
    <div className="page-stack inventory-page">
      <PageIntro eyebrow="Vorräte" title="Inventar" description={`${household.name}: Lebensmittel, Mengen und Ablaufdaten gemeinsam verwalten.`} />

      <div className="inventory-heading-actions">
        <span className={`realtime-indicator ${inventory.realtimeStatus}`}>
          <span aria-hidden="true" /> {inventory.realtimeStatus === 'connected' ? 'Live verbunden' : 'Verbindung wird aufgebaut'}
        </span>
        <button className="primary-button" type="button" onClick={() => setEditingItem(null)}>+ Lebensmittel</button>
      </div>

      <section className="inventory-filters" aria-label="Inventar filtern">
        <label className="search-field">
          <span className="visually-hidden">Lebensmittel suchen</span>
          <input type="search" placeholder="Lebensmittel suchen …" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select aria-label="Kategorie filtern" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Alle Kategorien</option>
          {INVENTORY_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select aria-label="Lagerort filtern" value={storageLocationId} onChange={(event) => setStorageLocationId(event.target.value)}>
          <option value="">Alle Lagerorte</option>
          {inventory.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
        <select aria-label="Ablauf filtern" value={expiry} onChange={(event) => setExpiry(event.target.value as typeof expiry)}>
          <option value="all">Alle Ablaufdaten</option><option value="soon">Bald fällig</option>
          <option value="expired">Abgelaufen</option><option value="without">Ohne Datum</option>
        </select>
      </section>

      {error && <p className="form-message error" role="alert">{error}</p>}

      {visibleItems.length === 0 ? (
        <EmptyState icon="▤" title={inventory.items.length ? 'Keine Treffer' : 'Noch keine Lebensmittel'}>
          {inventory.items.length ? 'Passe Suche oder Filter an.' : 'Füge euer erstes Lebensmittel hinzu.'}
        </EmptyState>
      ) : (
        <section className="inventory-list" aria-label="Lebensmittel">
          {visibleItems.map((item) => {
            const expiryInfo = getExpiryInfo(item.expires_on)
            const step = getQuantityStep(item.unit)
            const mergeCandidates = inventory.items.filter((target) => isMergeCandidate(item, target))
            return (
              <article className="inventory-card" key={item.id}>
                <div className="inventory-card-main">
                  <div>
                    <span className="item-category">{item.category}</span>
                    <h2>{item.name}</h2>
                    <p>{item.storageLocationName}{item.opened_on ? ' · geöffnet' : ''}</p>
                  </div>
                  <span className={`expiry-badge ${expiryInfo.kind}`}>{expiryInfo.label}</span>
                </div>
                <div className="quantity-control" aria-label={`Menge für ${item.name}`}>
                  <button type="button" aria-label={`${item.name} reduzieren`} disabled={busy !== null} onClick={() => void runMutation(`minus:${item.id}`, () => inventory.changeQuantity(item, -Math.min(step, item.quantity)), `${item.name} wurde reduziert.`)}>−</button>
                  <strong>{formatQuantity(item.quantity, item.unit)}</strong>
                  <button type="button" aria-label={`${item.name} erhöhen`} disabled={busy !== null} onClick={() => void runMutation(`plus:${item.id}`, () => inventory.changeQuantity(item, step), `${item.name} wurde erhöht.`)}>+</button>
                </div>
                <div className="item-actions">
                  <button type="button" onClick={() => setEditingItem(item)}>Bearbeiten</button>
                  <button type="button" disabled={!mergeCandidates.length || busy !== null} title={mergeCandidates.length ? '' : 'Kein passender doppelter Eintrag'} onClick={() => setMergingItem(item)}>Zusammenführen</button>
                  <button type="button" disabled={busy !== null} onClick={() => void runMutation(`consume:${item.id}`, () => inventory.changeQuantity(item, -item.quantity), `${item.name} wurde verbraucht.`)}>Verbraucht</button>
                  <button className="danger" type="button" disabled={busy !== null} onClick={() => void runMutation(`delete:${item.id}`, () => inventory.deleteItem(item), `${item.name} wurde gelöscht.`)}>Löschen</button>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className="history-section">
        <button className="history-toggle" type="button" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}>
          Verlauf ({inventory.transactions.length}) <span aria-hidden="true">{showHistory ? '−' : '+'}</span>
        </button>
        {showHistory && <ul className="history-list">{inventory.transactions.map((transaction) => <li key={transaction.id}><span><strong>{transaction.item_name}</strong> {actionLabels[transaction.action] ?? transaction.action}</span><time dateTime={transaction.created_at}>{new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(transaction.created_at))}</time></li>)}</ul>}
      </section>

      {editingItem !== undefined && <InventoryForm item={editingItem ?? undefined} locations={inventory.locations} busy={busy !== null} onCancel={() => setEditingItem(undefined)} onSubmit={saveItem} />}

      {mergingItem && (
        <div className="modal-backdrop" role="presentation">
          <section className="inventory-dialog compact" role="dialog" aria-modal="true" aria-labelledby="merge-title">
            <p className="eyebrow">Doppelten Bestand bereinigen</p><h2 id="merge-title">{mergingItem.name} zusammenführen</h2>
            <p>Wähle den Eintrag, der erhalten bleibt. Mengen werden addiert; diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="merge-options">{inventory.items.filter((target) => isMergeCandidate(mergingItem, target)).map((target) => <button className="secondary-button" type="button" key={target.id} onClick={() => { const source = mergingItem; setMergingItem(null); void runMutation(`merge:${source.id}`, () => inventory.mergeItems(source, target), `${source.name} wurde zusammengeführt.`) }}>{target.storageLocationName} · {formatQuantity(target.quantity, target.unit)}</button>)}</div>
            <button className="text-button" type="button" onClick={() => setMergingItem(null)}>Abbrechen</button>
          </section>
        </div>
      )}

      {undo && <UndoToast label={undo.label} expiresAt={undo.expiresAt} busy={busy === 'undo'} onExpire={expireUndo} onUndo={undoLastAction} />}
    </div>
  )
}
