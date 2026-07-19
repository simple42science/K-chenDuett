import { useEffect, useState } from 'react'

type UndoToastProps = {
  label: string
  expiresAt: string
  busy: boolean
  onExpire: () => void
  onUndo: () => Promise<void>
}

export function UndoToast({ label, expiresAt, busy, onExpire, onUndo }: UndoToastProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Date.parse(expiresAt) - Date.now()))

  useEffect(() => {
    const update = () => {
      const nextRemaining = Math.max(0, Date.parse(expiresAt) - Date.now())
      setRemaining(nextRemaining)
      if (nextRemaining === 0) onExpire()
    }
    const timer = window.setInterval(update, 200)
    return () => window.clearInterval(timer)
  }, [expiresAt, onExpire])

  return (
    <aside className="undo-toast" role="status">
      <span>{label}</span>
      <button type="button" disabled={busy || remaining === 0} onClick={() => void onUndo()}>
        {busy ? 'Wird rückgängig …' : `Rückgängig (${Math.ceil(remaining / 1000)})`}
      </button>
    </aside>
  )
}
