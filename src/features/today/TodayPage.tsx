import { EmptyState } from '../../components/EmptyState'
import { PageIntro } from '../../components/PageIntro'

const summaries = [
  { value: '0', label: 'Lebensmittel', tone: 'sage' },
  { value: '0', label: 'bald fällig', tone: 'apricot' },
  { value: '0', label: 'Rezeptideen', tone: 'cream' },
]

export function TodayPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Guten Appetit"
        title="Was kochen wir heute?"
        description="Sobald der gemeinsame Haushalt verbunden ist, siehst du hier euren aktuellen Überblick."
      />

      <section className="summary-grid" aria-label="Tagesübersicht">
        {summaries.map((summary) => (
          <article className={`summary-card ${summary.tone}`} key={summary.label}>
            <strong>{summary.value}</strong>
            <span>{summary.label}</span>
          </article>
        ))}
      </section>

      <EmptyState icon="✦" title="Die Grundlage steht">
        Anmeldung, Haushalt und echte Bestände folgen in den nächsten Arbeitspaketen.
      </EmptyState>
    </div>
  )
}
