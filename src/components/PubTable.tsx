import type { MouseEvent } from 'react'
import type { ColumnDef, Publication, PublicationKey } from '../types'
import { copyText } from '../lib/copy'
import { downloadRis } from '../lib/export'
import { assetUrl } from '../lib/pdfName'
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
}

function cellText(pub: Publication, key: PublicationKey): string {
  const v = pub[key]
  if (key === 'coFirst' || key === 'isFirstAuthor' || key === 'isCorresponding') return v ? '是' : '否'
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

async function openPdfOrToast(relativePath: string): Promise<void> {
  const url = assetUrl(relativePath)
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) {
      // 部分静态托管对 HEAD 不友好，再试 GET 前几个字节
      const get = await fetch(url, { method: 'GET' })
      if (!get.ok) {
        const name = relativePath.split('/').pop() || relativePath
        toast(`PDF 未找到（404）。请将文件放入 public/paper/：${name}`)
        return
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    toast('无法打开 PDF，请检查网络或文件是否已上传')
  }
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
}: Props) {
  const cols = columns.filter((c) => visible.has(c.key))

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
            <th className="sticky-col actions-col">操作</th>
            {cols.map((c) => {
              const active = sortKey === c.key
              const canSort = c.sortable !== false && c.key !== 'ris' && c.key !== 'pdfFull' && c.key !== 'pdfFirst' && c.key !== 'pubmed'
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
            <tr key={pub.id}>
              <td className="sticky-col actions-col">
                <div className="row-btns">
                  <button type="button" className="btn tiny" onClick={() => onEdit(pub)}>
                    编辑
                  </button>
                  <button
                    type="button"
                    className="btn tiny danger"
                      onClick={() => onDelete(pub.id)}
                    >
                      删除
                    </button>
                  <button
                    type="button"
                    className="btn tiny"
                    onClick={() => downloadRis(pub)}
                    disabled={!pub.ris}
                  >
                    RIS
                  </button>
                </div>
              </td>
              {cols.map((c) => {
                const text = cellText(pub, c.key)

                if (c.key === 'pubmed') {
                  const href = safeHttpUrl(text)
                  return (
                    <td key={c.key}>
                      <div className="link-cell">
                        {href ? (
                          <a className="text-link" href={href} target="_blank" rel="noreferrer" title={text}>
                            打开
                          </a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                        {text ? (
                          <button type="button" className="btn tiny" onClick={(e) => onCopy(text, e)}>
                            复制
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )
                }

                if (c.key === 'pdfFull' || c.key === 'pdfFirst') {
                  const label = c.key === 'pdfFull' ? '全文' : '首页'
                  return (
                    <td key={c.key}>
                      {text ? (
                        <div className="link-cell">
                          <button
                            type="button"
                            className="text-link btn-link"
                            title={`打开：${text}`}
                            onClick={() => void openPdfOrToast(text)}
                          >
                            {label}
                          </button>
                          <button type="button" className="btn tiny" onClick={(e) => onCopy(text, e)}>
                            路径
                          </button>
                        </div>
                      ) : (
                        <span className="muted pad">未上传</span>
                      )}
                    </td>
                  )
                }

                if (c.key === 'coFirst' || c.key === 'isFirstAuthor' || c.key === 'isCorresponding') {
                  const on = Boolean(pub[c.key])
                  const chipClass =
                    c.key === 'isCorresponding'
                      ? 'chip chip-corr'
                      : c.key === 'isFirstAuthor'
                        ? 'chip chip-first'
                        : 'chip chip-co'
                  return (
                    <td key={c.key}>
                      <button
                        type="button"
                        className="cell-btn trunc"
                        title={text}
                        onClick={(e) => onCopy(text, e)}
                      >
                        {on ? <span className={chipClass}>是</span> : <span className="muted">否</span>}
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

                if (c.key === 'rank') {
                  const full =
                    pub.rank != null
                      ? `${pub.rank}${pub.totalAuthors != null ? `/${pub.totalAuthors}` : ''}`
                      : ''
                  return (
                    <td key={c.key}>
                      <button
                        type="button"
                        className="cell-btn trunc"
                        title={full}
                        onClick={(e) => onCopy(full || text, e)}
                      >
                        {full || <span className="muted">—</span>}
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
