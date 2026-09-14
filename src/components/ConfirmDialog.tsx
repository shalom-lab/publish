import { useEffect } from 'react'

interface Props {
  open: boolean
  title?: string
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = '确认删除',
  message,
  detail,
  confirmLabel = '删除',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon" aria-hidden>
          !
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-desc" className="confirm-msg">
          {message}
        </p>
        {detail ? (
          <p className="confirm-detail" title={detail}>
            {detail}
          </p>
        ) : null}
        <p className="confirm-hint">此操作仅影响当前页面数据，保存到 GitHub 后才会永久生效。</p>
        <div className="confirm-actions">
          <button type="button" className="btn ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
