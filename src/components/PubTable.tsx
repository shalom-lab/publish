import type { MouseEvent } from 'react'
import type { ColumnDef, Publication, PublicationKey } from '../types'
import { copyText } from '../lib/copy'
import { assetUrl } from '../lib/pdfName'
import { rankDisplay } from '../lib/publication'
import { toast } from './Toast'

export type SortDir = 'asc' | 'desc'

interface Props {
  publications: Publication[]
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  sortKey: PublicationKey
  sortDir: SortDir
  onSort: (key: PublicationKey) => void
  onEdit: (pub: Publication) => void
  onDelete: (id: string) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
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

export function PubTable({
  publications,
  columns,
  visible,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const cols = columns.filter((c) => visible.has(c.key))
  const allSelected = publications.length > 0 && publications.every((p) => selectedIds.has(p.id))
  const someSelected = publications.some((p) => selectedIds.has(p.id))

  const onCopy = async (text: string, e?: MouseEvent) => {
    e?.stopPropagation()
    const ok = await copyText(text)
    toast(ok ? '复制成功' : '复制失败')
  }

  return (
    <div className="table-wrap">
      <table className="pub-table">
        <thead>
          <tr>
            <th className="sticky-col select-col">
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
            <th className="sticky-col actions-col">操作</th>
            {cols.map((c) => {
              const active = sortKey === c.key
              const canSort =
                c.sortable !== false &&
                c.key !== 'ris' &&
                c.key !== 'pdfFull' &&
                c.key !== 'pdfFirst' &&
                c.key !== 'pubmed' &&
                c.key !== 'online'
              return (
                <th key={c.key}>
                  {canSort ? (
                    <button
                      type="button"
                      className={`th-sort ${active ? 'active' : ''}`}
                      onClick={() => onSort(c.key)}
                      title="点击排序"
                    >
                      {c.label}
                      <span className="sort-icon">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {publications.map((pub) => (
            <tr key={pub.id} className={selectedIds.has(pub.id) ? 'row-selected' : undefined}>
              <td className="sticky-col select-col">
                <input
                  type="checkbox"
                  checked={selectedIds.has(pub.id)}
                  onChange={() => onToggleSelect(pub.id)}
                  aria-label={`选中 ${pub.title || pub.id}`}
                />
              </td>
              <td className="sticky-col actions-col">
                <div className="row-btns">
                  <button
                    type="button"
                    className="btn tiny icon-btn"
                    onClick={() => onEdit(pub)}
                    title="编辑"
                    aria-label="编辑"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path d="M12.5 7l4.5 4.5" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="btn tiny icon-btn danger"
                    onClick={() => onDelete(pub.id)}
                    title="删除"
                    aria-label="删除"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
              {cols.map((c) => {
                const text = cellText(pub, c.key)

                if (c.key === 'pubmed' || c.key === 'online') {
                  const href = safeHttpUrl(text)
                  return (
                    <td key={c.key}>
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
                    <td key={c.key}>
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
                    <td key={c.key} className="yesno-col">
                      <button
                        type="button"
                        className="cell-btn yesno"
                        title={text}
                        onClick={(e) => onCopy(text, e)}
                      >
                        <span className={`chip yesno ${on ? 'on' : 'off'}`}>{on ? '是' : '否'}</span>
                      </button>
                    </td>
                  )
                }

                if (c.key === 'cas' && text) {
                  return (
                    <td key={c.key}>
                      <button
                        type="button"
                        className="cell-btn trunc"
                        title={text}
                        onClick={(e) => onCopy(text, e)}
                      >
                        <span className="chip chip-cas trunc-inner">{text}</span>
                      </button>
                    </td>
                  )
                }

                if (c.key === 'impactFactor') {
                  return (
                    <td key={c.key}>
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
                    <td key={c.key} className="yesno-col">
                      <button
                        type="button"
                        className="cell-btn yesno"
                        title={full}
                        onClick={(e) => onCopy(full, e)}
                      >
                        {full ? <span className="chip chip-rank">{full}</span> : <span className="muted">—</span>}
                      </button>
                    </td>
                  )
                }

                return (
                  <td key={c.key} className={c.key === 'title' ? 'col-title' : undefined}>
                    <TruncCell text={text} onCopy={onCopy} className={c.key === 'title' ? 'title-cell' : ''} />
                  </td>
                )
              })}
            </tr>
          ))}
          {!publications.length && (
            <tr>
              <td colSpan={cols.length + 1} className="empty">
                暂无记录，点击「新增」添加。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
