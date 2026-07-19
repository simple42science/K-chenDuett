import { EmptyState } from '../../components/EmptyState'
import { PageIntro } from '../../components/PageIntro'

export function RecipesPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Inspiration"
        title="Rezepte"
        description="Ideen, die zu euren Vorräten, eurer Zeit und euren Geräten passen."
      />
      <EmptyState icon="◇" title="Rezepte folgen später">
        Das sichere Datenfundament ist vorbereitet; Rezeptlogik ist Bestandteil von AP5.
      </EmptyState>
    </div>
  )
}
