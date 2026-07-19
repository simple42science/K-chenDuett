import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Heute', symbol: '⌂', end: true },
  { to: '/inventar', label: 'Inventar', symbol: '▤' },
  { to: '/rezepte', label: 'Rezepte', symbol: '◇' },
  { to: '/mehr', label: 'Mehr', symbol: '•••' },
] as const

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="KüchenDuett Startseite">
          <span className="brand-mark" aria-hidden="true">
            KD
          </span>
          <span>
            <strong>KüchenDuett</strong>
            <small>Gemeinsam besser verwerten</small>
          </span>
        </NavLink>
        <span className="status-pill">
          <span aria-hidden="true" /> Grundlage bereit
        </span>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span className="nav-symbol" aria-hidden="true">
              {item.symbol}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
