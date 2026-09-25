import { useRef, useState } from 'react'
import type { ColumnDef, PublicationKey } from '../types'

interface Props {
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  pinned: Set<PublicationKey>
  onToggle: (key: PublicationKey) => void
  onTogglePin: (key: PublicationKey) => void
  onReorder: (from: number, to: number) => void
}

export function ColumnToggle({
  columns,
  visible,
  pinned,
  onToggle,
  onTogglePin,
  onReorder,
}: Props) {
  const dragFrom = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <details className="column-toggle">
      <summary>列显隐</summary>
      <div className="column-toggle-panel">
        <p className="column-toggle-hint">拖动手柄调序 · 图钉固定左列（表头也可右键）</p>
        {columns.map((c, index) => {
          const isPinned = pinned.has(c.key)
          return (
            <div
              key={c.key}
              className={`check-row column-drag-row${overIndex === index ? ' drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const from = dragFrom.current
                dragFrom.current = null
                setOverIndex(null)
                if (from === null || from === index) return
                onReorder(from, index)
              }}
            >
              <span
                className="drag-handle"
                title="拖动排序"
                draggable
                onDragStart={(e) => {
                  dragFrom.current = index
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(index))
                }}
                onDragEnd={() => {
                  dragFrom.current = null
                  setOverIndex(null)
                }}
              >
                ⋮⋮
              </span>
              <label className="check-row-label">
                <input
                  type="checkbox"
                  checked={visible.has(c.key)}
                  onChange={() => onToggle(c.key)}
                />
                {c.label}
              </label>
              <button
                type="button"
                className={`pin-btn${isPinned ? ' on' : ''}`}
                title={isPinned ? '取消固定' : '固定到左侧'}
                aria-label={isPinned ? `取消固定 ${c.label}` : `固定 ${c.label}`}
                onClick={() => onTogglePin(c.key)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2l1.2 6.2L19 10l-5.8 1.8L12 18l-1.2-6.2L5 10l5.8-1.8L12 2z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    fill={isPinned ? 'currentColor' : 'none'}
                  />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </details>
  )
}
