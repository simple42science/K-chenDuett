import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unbehandelter Anwendungsfehler', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">Da ist etwas schiefgelaufen</p>
          <h1>Die Küche braucht einen Neustart.</h1>
          <p>Deine Daten wurden dadurch nicht verändert. Lade die App bitte neu.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
