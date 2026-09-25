import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { ColumnDef, Publication, PublicationKey } from '../types'
import { copyText } from '../lib/copy'
import {
  clampColumnWidth,
  DEFAULT_COLUMN_WIDTHS,
  splitVisibleColumns,
  type ColumnWidths,
} from '../lib/columnPrefs'
import { assetUrl } from '../lib/pdfName'
import { rankDisplay } from '../lib/publication'
import { toast } from './Toast'

export type SortDir = 'asc' | 'desc'

const SELECT_WIDTH = 36
const ACTIONS_WIDTH = 64

interface Props {
  publications: Publication[]
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  pinned: PublicationKey[]
  widths: ColumnWidths
  sortKey: PublicationKey
  sortDir: SortDir
  onSort: (key: PublicationKey) => void
  onTogglePin: (key: PublicationKey) => void
  onResizeColumn: (key: PublicationKey, width: number) => void
  onEdit: (pub: Publication) => void
  onDelete: (id: string) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
}

interface HeaderMenu {
  x: number
  y: number
  key: PublicationKey
  label: string
}

function cellText(pub: Publication, key: PublicationKey): string {
  const v = pub[key]
  if (key === 'coFirst' || key === 'isFirstAuthor' || key === 'isCorresponding') return v ? '是' : '否'
  if (key === 'rank') return rankDisplay(pub)
  if (v === null || v === undefined) return ''
  return String(v)
}

function safeHttpUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href
  } catch {
    /* ignore */
  }
  return null
}

function TruncCell({
  text,
  onCopy,
  className = '',
}: {
  text: string
  onCopy: (text: string, e?: MouseEvent) => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`cell-btn trunc ${className}`}
      title={text || undefined}
      onClick={(e) => onCopy(text, e)}
    >
      <span className="trunc-inner">{text || <span className="muted">—</span>}</span>
    </button>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12.5 7l4.5 4.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PubTable({
  publications,
  columns,
  visible,
  pinned,
  widths,
  sortKey,
  sortDir,
  onSort,
  onTogglePin,
  onResizeColumn,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const { pinnedCols, scrollCols } = useMemo(
    () => splitVisibleColumns(columns, visible, pinned),
    [columns, visible, pinned],
  )
  const allCols = useMemo(() => [...pinnedCols, ...scrollCols], [pinnedCols, scrollCols])
  const pinSet = useMemo(() => new Set(pinned), [pinned])

  const allSelected = publications.length > 0 && publications.every((p) => selectedIds.has(p.id))
  const someSelected = publications.some((p) => selectedIds.has(p.id))

  const [menu, setMenu] = useState<HeaderMenu | null>(null)
  const [pinLefts, setPinLefts] = useState<Partial<Record<PublicationKey, number>>>({})
  const resizeRef = useRef<{ key: PublicationKey; startX: number; startW: number } | null>(null)

  const colWidth = (key: PublicationKey): number =>
    widths[key] ?? DEFAULT_COLUMN_WIDTHS[key] ?? 120

  const colBoxStyle = (key: PublicationKey, sticky?: boolean): CSSProperties => {
    const w = colWidth(key)
    const style: CSSProperties = {
      width: w,
      minWidth: w,
      maxWidth: w,
    }
    if (sticky) style.left = pinLefts[key] ?? SELECT_WIDTH
    return style
  }

  useLayoutEffect(() => {
    let left = SELECT_WIDTH
    const next: Partial<Record<PublicationKey, number>> = {}
    for (const col of pinnedCols) {
      next[col.key] = left
      left += widths[col.key] ?? DEFAULT_COLUMN_WIDTHS[col.key] ?? 120
    }
    setPinLefts(next)
  }, [pinnedCols, widths])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = resizeRef.current
      if (!drag) return
      const next = clampColumnWidth(drag.startW + (e.clientX - drag.startX))
      onResizeColumn(drag.key, next)
    }
    const onUp = () => {
      if (!resizeRef.current) return
      resizeRef.current = null
      document.body.classList.remove('col-resizing')
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [onResizeColumn])

  const startResize = (key: PublicationKey, e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { key, startX: e.clientX, startW: colWidth(key) }
    document.body.classList.add('col-resizing')
  }

  const resetWidth = (key: PublicationKey, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onResizeColumn(key, DEFAULT_COLUMN_WIDTHS[key] ?? 120)
  }

  const onCopy = async (text: string, e?: MouseEvent) => {
    e?.stopPropagation()
    const ok = await copyText(text)
    toast(ok ? '复制成功' : '复制失败')
  }

  const renderDataCell = (c: ColumnDef, pub: Publication, sticky?: boolean): ReactNode => {
    const text = cellText(pub, c.key)
    const isLastPinned = sticky && pinnedCols.length > 0 && pinnedCols[pinnedCols.length - 1]?.key === c.key
    const style = colBoxStyle(c.key, sticky)
    const className = [
      sticky ? 'sticky-col sticky-left pinned-col' : '',
      isLastPinned ? 'sticky-edge-left' : '',
      c.key === 'title' ? 'col-title' : '',
      c.key === 'rank' || c.key === 'firstAuthorRank' || c.key === 'coFirst' || c.key === 'isFirstAuthor' || c.key === 'isCorresponding'
        ? 'yesno-col'
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    if (c.key === 'pubmed' || c.key === 'online') {
      const href = safeHttpUrl(text)
      return (
        <td key={c.key} className={className || undefined} style={style}>
          <div className="link-cell">
            {href ? (
              <a className="text-link" href={href} target="_blank" rel="noreferrer" title={text}>
                {c.key === 'pubmed' ? 'Pubmed' : '在线'}
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </td>
      )
    }

    if (c.key === 'pdfFull' || c.key === 'pdfFirst') {
      const label = c.key === 'pdfFull' ? '全文' : '首页'
      const href = text ? assetUrl(text) : ''
      return (
        <td key={c.key} className={className || undefined} style={style}>
          <div className="link-cell">
            {href ? (
              <a
                className="text-link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={text}
              >
                {label}
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </td>
      )
    }

    if (c.key === 'coFirst' || c.key === 'isFirstAuthor' || c.key === 'isCorresponding') {
      const on = Boolean(pub[c.key])
      return (
        <td key={c.key} className={className || 'yesno-col'} style={style}>
          <button type="button" className="cell-btn yesno" title={text} onClick={(e) => onCopy(text, e)}>
            <span className={`chip yesno ${on ? 'on' : 'off'}`}>{on ? '是' : '否'}</span>
          </button>
        </td>
      )
    }

    if (c.key === 'cas' && text) {
      return (
        <td key={c.key} className={className || undefined} style={style}>
          <button type="button" className="cell-btn trunc" title={text} onClick={(e) => onCopy(text, e)}>
            <span className="chip chip-cas trunc-inner">{text}</span>
          </button>
        </td>
      )
    }

    if (c.key === 'impactFactor') {
      return (
        <td key={c.key} className={className || undefined} style={style}>
          <button
            type="button"
            className="cell-btn trunc"
            title={text || '中文刊可不填 IF'}
            onClick={(e) => onCopy(text, e)}
          >
            {text ? <span className="chip chip-if">IF {text}</span> : <span className="muted">—</span>}
          </button>
        </td>
      )
    }

    if (c.key === 'rank' || c.key === 'firstAuthorRank') {
      const full = c.key === 'rank' ? rankDisplay(pub) : text
      return (
        <td key={c.key} className={className || 'yesno-col'} style={style}>
          <button type="button" className="cell-btn yesno" title={full} onClick={(e) => onCopy(full, e)}>
            {full ? <span className="chip chip-rank">{full}</span> : <span className="muted">—</span>}
          </button>
        </td>
      )
    }

    return (
      <td key={c.key} className={className || undefined} style={style}>
        <TruncCell text={text} onCopy={onCopy} className={c.key === 'title' ? 'title-cell' : ''} />
      </td>
    )
  }

  const renderHeader = (c: ColumnDef, sticky: boolean) => {
    const active = sortKey === c.key
    const canSort =
      c.sortable !== false &&
      c.key !== 'ris' &&
      c.key !== 'pdfFull' &&
      c.key !== 'pdfFirst' &&
      c.key !== 'pubmed' &&
      c.key !== 'online'
    const isPinned = pinSet.has(c.key)
    const isLastPinned = sticky && pinnedCols[pinnedCols.length - 1]?.key === c.key
    const style = colBoxStyle(c.key, sticky)

    return (
      <th
        key={c.key}
        className={[
          sticky ? 'sticky-col sticky-left pinned-col' : '',
          isLastPinned ? 'sticky-edge-left' : '',
          c.key === 'title' ? 'col-title' : '',
        ]
          .filter(Boolean)
          .join(' ') || undefined}
        style={style}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY, key: c.key, label: c.label })
        }}
        title="左键排序 · 右键固定 · 右缘拖拽调宽"
      >
        <div className="th-inner">
          {canSort ? (
            <button
              type="button"
              className={`th-sort ${active ? 'active' : ''}`}
              onClick={() => onSort(c.key)}
            >
              {isPinned && <span className="pin-mark" aria-hidden />}
              {c.label}
              <span className="sort-icon">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
            </button>
          ) : (
            <span className="th-label">
              {isPinned && <span className="pin-mark" aria-hidden />}
              {c.label}
            </span>
          )}
        </div>
        <span
          className="col-resize-handle"
          onPointerDown={(e) => startResize(c.key, e)}
          onDoubleClick={(e) => resetWidth(c.key, e)}
          title="拖拽调节列宽 · 双击恢复默认"
        />
      </th>
    )
  }

  const actionsHeader = (
    <th
      className="sticky-col sticky-right actions-col sticky-edge-right"
      style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, maxWidth: ACTIONS_WIDTH }}
    >
      操作
    </th>
  )

  const actionsCell = (pub: Publication) => (
    <td
      className="sticky-col sticky-right actions-col sticky-edge-right"
      style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, maxWidth: ACTIONS_WIDTH }}
    >
      <div className="row-btns">
        <button
          type="button"
          className="btn tiny icon-btn"
          onClick={() => onEdit(pub)}
          title="编辑"
          aria-label="编辑"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className="btn tiny icon-btn danger"
          onClick={() => onDelete(pub.id)}
          title="删除"
          aria-label="删除"
        >
          <DeleteIcon />
        </button>
      </div>
    </td>
  )

  return (
    <div className="table-wrap">
      <table className="pub-table">
        <colgroup>
          <col style={{ width: SELECT_WIDTH }} />
          {allCols.map((c) => (
            <col key={c.key} style={{ width: colWidth(c.key) }} />
          ))}
          <col style={{ width: ACTIONS_WIDTH }} />
        </colgroup>
        <thead>
          <tr>
            <th
              className="sticky-col sticky-left select-col"
              style={{ left: 0, width: SELECT_WIDTH, minWidth: SELECT_WIDTH, maxWidth: SELECT_WIDTH }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onChange={onToggleSelectAll}
                title={allSelected ? '取消全选' : '全部选中'}
                aria-label={allSelected ? '取消全选' : '全部选中'}
              />
            </th>
            {pinnedCols.map((c) => renderHeader(c, true))}
            {scrollCols.map((c) => renderHeader(c, false))}
            {actionsHeader}
          </tr>
        </thead>
        <tbody>
          {publications.map((pub) => (
            <tr key={pub.id} className={selectedIds.has(pub.id) ? 'row-selected' : undefined}>
              <td
                className="sticky-col sticky-left select-col"
                style={{ left: 0, width: SELECT_WIDTH, minWidth: SELECT_WIDTH, maxWidth: SELECT_WIDTH }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(pub.id)}
                  onChange={() => onToggleSelect(pub.id)}
                  aria-label={`选中 ${pub.title || pub.id}`}
                />
              </td>
              {pinnedCols.map((c) => renderDataCell(c, pub, true))}
              {scrollCols.map((c) => renderDataCell(c, pub, false))}
              {actionsCell(pub)}
            </tr>
          ))}
          {!publications.length && (
            <tr>
              <td colSpan={allCols.length + 2} className="empty">
                暂无记录，点击「新增」添加。
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {menu && (
        <div
          className="col-context-menu"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onTogglePin(menu.key)
              setMenu(null)
              toast(pinSet.has(menu.key) ? `已取消固定「${menu.label}」` : `已固定「${menu.label}」`)
            }}
          >
            {pinSet.has(menu.key) ? `取消固定「${menu.label}」` : `固定「${menu.label}」列`}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onResizeColumn(menu.key, DEFAULT_COLUMN_WIDTHS[menu.key] ?? 120)
              setMenu(null)
              toast(`已重置「${menu.label}」列宽`)
            }}
          >
            重置「{menu.label}」列宽
          </button>
        </div>
      )}
    </div>
  )
}
