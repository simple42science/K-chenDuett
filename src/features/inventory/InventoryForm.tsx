import { useState, type FormEvent } from 'react'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  type InventoryItem,
  type InventoryItemInput,
  type StorageLocation,
} from './inventoryModel'

type InventoryFormProps = {
  item?: InventoryItem
  locations: StorageLocation[]
  busy: boolean
  onCancel: () => void
  onSubmit: (input: InventoryItemInput) => Promise<void>
}

export function InventoryForm({ item, locations, busy, onCancel, onSubmit }: InventoryFormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? 'Sonstiges')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [unit, setUnit] = useState(item?.unit ?? 'Stück')
  const [storageLocationId, setStorageLocationId] = useState(
    item?.storage_location_id ?? locations[0]?.id ?? '',
  )
  const [expiresOn, setExpiresOn] = useState(item?.expires_on ?? '')
  const [openedOn, setOpenedOn] = useState(item?.opened_on ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericQuantity = Number(quantity.replace(',', '.'))
    if (!name.trim()) return setError('Bitte gib einen Namen ein.')
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      return setError('Die Menge muss grösser als null sein.')
    }
    if (!storageLocationId) return setError('Bitte wähle einen Lagerort.')
    if (openedOn && openedOn > new Date().toISOString().slice(0, 10)) {
      return setError('Das Öffnungsdatum darf nicht in der Zukunft liegen.')
    }

    setError(null)
    await onSubmit({
      name: name.trim(),
      category,
      quantity: numericQuantity,
      unit,
      storageLocationId,
      expiresOn: expiresOn || null,
      openedOn: openedOn || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="inventory-dialog" role="dialog" aria-modal="true" aria-labelledby="item-form-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{item ? 'Bearbeiten' : 'Schnellerfassung'}</p>
            <h2 id="item-form-title">{item ? item.name : 'Lebensmittel hinzufügen'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Schliessen" onClick={onCancel}>
            ×
          </button>
        </div>

        <form className="inventory-form" onSubmit={(event) => void submit(event)}>
          <label className="wide-field">
            Lebensmittel
            <input autoFocus maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Menge
            <input
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label>
            Einheit
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              {INVENTORY_UNITS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Kategorie
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {INVENTORY_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Lagerort
            <select value={storageLocationId} onChange={(event) => setStorageLocationId(event.target.value)}>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label>
            Ablaufdatum
            <input type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
          </label>
          <label>
            Geöffnet am
            <input type="date" value={openedOn} onChange={(event) => setOpenedOn(event.target.value)} />
          </label>
          <label className="wide-field">
            Notizen
            <textarea maxLength={1000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          {error && <p className="form-message error wide-field" role="alert">{error}</p>}

          <div className="dialog-actions wide-field">
            <button className="text-button" type="button" onClick={onCancel}>Abbrechen</button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Speichert …' : item ? 'Änderungen speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
