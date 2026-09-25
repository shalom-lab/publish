import { useRef, useState } from 'react'
import type { ColumnDef, PublicationKey } from '../types'

interface Props {
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  onToggle: (key: PublicationKey) => void
  onReorder: (from: number, to: number) => void
}

export function ColumnToggle({ columns, visible, onToggle, onReorder }: Props) {
  const dragFrom = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <details className="column-toggle">
      <summary>列显隐</summary>
      <div className="column-toggle-panel">
        <p className="column-toggle-hint">拖动手柄调整列顺序</p>
        {columns.map((c, index) => (
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
          </div>
        ))}
      </div>
    </details>
  )
}
