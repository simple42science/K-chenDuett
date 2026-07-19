import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: string
  title: string
  children: ReactNode
}

export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  )
}
