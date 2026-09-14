import type { ColumnDef, PublicationKey } from '../types'

interface Props {
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  onToggle: (key: PublicationKey) => void
}

export function ColumnToggle({ columns, visible, onToggle }: Props) {
  return (
    <details className="column-toggle">
      <summary>列显隐</summary>
      <div className="column-toggle-panel">
        {columns.map((c) => (
          <label key={c.key} className="check-row">
            <input
              type="checkbox"
              checked={visible.has(c.key)}
              onChange={() => onToggle(c.key)}
            />
            {c.label}
          </label>
        ))}
      </div>
    </details>
  )
}
