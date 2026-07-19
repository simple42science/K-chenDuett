import { PageIntro } from '../../components/PageIntro'

const settings = [
  ['Haushalt', 'Mitglieder und Einladung'],
  ['Küchengeräte', 'Ausstattung verwalten'],
  ['Datenschutz', 'Export und Löschfunktionen'],
]

export function MorePage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Einstellungen"
        title="Mehr"
        description="Gemeinsame Ausstattung, Haushalt und Daten an einem Ort."
      />
      <section className="settings-list" aria-label="Künftige Einstellungen">
        {settings.map(([title, description]) => (
          <article key={title}>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <span aria-hidden="true">›</span>
          </article>
        ))}
      </section>
    </div>
  )
}
