import { EmptyState } from '../../components/EmptyState'
import { PageIntro } from '../../components/PageIntro'

export function InventoryPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Vorräte"
        title="Inventar"
        description="Lebensmittel finden, Mengen ändern und Ablaufdaten im Blick behalten."
      />
      <div className="toolbar-placeholder" aria-hidden="true">
        <span>Lebensmittel suchen</span>
        <span>Filter</span>
      </div>
      <EmptyState icon="▤" title="Noch keine Lebensmittel">
        Die Inventarfunktionen werden nach Anmeldung und Haushalt aktiviert.
      </EmptyState>
    </div>
  )
}
