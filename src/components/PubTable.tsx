import type { ColumnDef, Publication, PublicationKey } from '../types'
import { copyText } from '../lib/copy'
import { downloadRis } from '../lib/export'
import { assetUrl } from '../lib/pdfName'
import { toast } from './Toast'

interface Props {
  publications: Publication[]
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  onEdit: (pub: Publication) => void
  onDelete: (id: string) => void
}

function cellText(pub: Publication, key: PublicationKey): string {
  const v = pub[key]
  if (key === 'coFirst') return v ? '是' : '否'
  if (v === null || v === undefined) return ''
  return String(v)
}

export function PubTable({ publications, columns, visible, onEdit, onDelete }: Props) {
  const cols = columns.filter((c) => visible.has(c.key))

  const onCopy = async (text: string) => {
    const ok = await copyText(text)
    toast(ok ? '已复制' : '复制失败')
  }

  return (
    <div className="table-wrap">
      <table className="pub-table">
        <thead>
          <tr>
            <th className="sticky-col actions-col">操作</th>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
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
                    onClick={() => {
                      if (confirm('确定删除这条记录？')) onDelete(pub.id)
                    }}
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
                if (c.key === 'pubmed' && text) {
                  return (
                    <td key={c.key} className="cell-copy" title="点击复制">
                      <button type="button" className="cell-btn" onClick={() => onCopy(text)}>
                        <a href={text} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          Pubmed
                        </a>
                        <span className="cell-preview">{text}</span>
                      </button>
                    </td>
                  )
                }
                if (c.key === 'pdfFull' || c.key === 'pdfFirst') {
                  const label = c.key === 'pdfFull' ? '全文' : '首页'
                  return (
                    <td key={c.key} className="cell-copy">
                      {text ? (
                        <div className="pdf-cell">
                          <a href={assetUrl(text)} target="_blank" rel="noreferrer" download>
                            {label}
                          </a>
                          <button type="button" className="btn tiny" onClick={() => onCopy(text)}>
                            复制路径
                          </button>
                        </div>
                      ) : (
                        <button type="button" className="cell-btn muted" onClick={() => onCopy('')}>
                          —
                        </button>
                      )}
                    </td>
                  )
                }
                if (c.key === 'ris') {
                  return (
                    <td key={c.key} className="cell-copy">
                      <button
                        type="button"
                        className="cell-btn"
                        onClick={() => onCopy(text)}
                        title="点击复制 RIS"
                      >
                        {text ? '复制 RIS' : '—'}
                      </button>
                    </td>
                  )
                }
                return (
                  <td key={c.key} className="cell-copy" title="点击复制">
                    <button type="button" className="cell-btn" onClick={() => onCopy(text)}>
                      {text || <span className="muted">—</span>}
                    </button>
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
