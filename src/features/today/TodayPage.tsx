import { EmptyState } from '../../components/EmptyState'
import { PageIntro } from '../../components/PageIntro'
import { getExpiryInfo } from '../inventory/inventoryLogic'
import { useInventory } from '../inventory/useInventory'

export function TodayPage() {
  const { items, status } = useInventory()
  const expiring = items.filter((item) => ['expired', 'today', 'soon'].includes(getExpiryInfo(item.expires_on).kind)).length
  const summaries = [
    { value: String(items.length), label: 'Lebensmittel', tone: 'sage' },
    { value: String(expiring), label: 'bald fällig', tone: 'apricot' },
    { value: '0', label: 'Rezeptideen', tone: 'cream' },
  ]

  return (
    <div className="page-stack">
      <PageIntro eyebrow="Guten Appetit" title="Was kochen wir heute?" description="Euer gemeinsamer Überblick über Vorräte und bald fällige Lebensmittel." />
      <section className="summary-grid" aria-label="Tagesübersicht">
        {summaries.map((summary) => <article className={`summary-card ${summary.tone}`} key={summary.label}><strong>{status === 'loading' ? '–' : summary.value}</strong><span>{summary.label}</span></article>)}
      </section>
      {items.length === 0 && status === 'ready' ? <EmptyState icon="✦" title="Eure Küche wartet">Fügt im Inventar das erste Lebensmittel hinzu.</EmptyState> : <EmptyState icon="✓" title="Bestand synchronisiert">Änderungen eures Haushalts erscheinen automatisch auf beiden Geräten.</EmptyState>}
    </div>
  )
}
