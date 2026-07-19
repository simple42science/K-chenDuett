type AppLoadingProps = {
  message?: string
}

export function AppLoading({ message = 'KüchenDuett wird vorbereitet …' }: AppLoadingProps) {
  return (
    <main className="centered-state" aria-live="polite" aria-busy="true">
      <span className="loading-mark" aria-hidden="true">
        KD
      </span>
      <p>{message}</p>
    </main>
  )
}
