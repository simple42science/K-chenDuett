type ConfigurationErrorPageProps = {
  missing: string[]
}

export function ConfigurationErrorPage({ missing }: ConfigurationErrorPageProps) {
  return (
    <main className="fatal-error">
      <p className="eyebrow">Konfiguration fehlt</p>
      <h1>Supabase ist noch nicht verbunden.</h1>
      <p>
        Ergänze die öffentlichen Werte in <code>.env.local</code> und starte die App neu.
      </p>
      <ul className="config-list">
        {missing.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
