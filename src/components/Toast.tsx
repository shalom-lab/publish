import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
}

let pushToast: ((message: string) => void) | null = null

export function toast(message: string): void {
  pushToast?.(message)
}

export function ToastHost(): ReactNode {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    pushToast = (message: string) => {
      const id = Date.now() + Math.random()
      setItems((prev) => [...prev, { id, message }])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id))
      }, 2800)
    }
    return () => {
      pushToast = null
    }
  }, [])

  if (!items.length) return null
  return (
    <div className="toast-host" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.message}
        </div>
      ))}
    </div>
  )
}
