import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Publication } from '../types'
import { buildPdfPaths } from '../lib/pdfName'
import { generateRis } from '../lib/ris'
import { syncDerivedFields } from '../lib/publication'

interface Props {
  open: boolean
  initial: Publication | null
  onClose: () => void
  onSave: (pub: Publication) => void
}

export function EditForm({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Publication | null>(null)

  useEffect(() => {
    if (open && initial) setForm({ ...initial })
  }, [open, initial])

  if (!open || !form) return null

  const set = <K extends keyof Publication>(key: K, value: Publication[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const fillPdfNames = () => {
    const paths = buildPdfPaths(form)
    setForm({ ...form, ...paths })
  }

  const regenRis = () => {
    setForm({ ...form, ris: generateRis(form) })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(syncDerivedFields(form))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{initial?.title ? '编辑论文' : '新增论文'}</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </header>
        <form className="form-grid" onSubmit={submit}>
          <label>
            发表年月
            <input value={form.date} onChange={(e) => set('date', e.target.value)} placeholder="2023/11" />
          </label>
          <label>
            发表年份
            <input value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="2023" />
          </label>
          <label className="full">
            论文题目
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label>
            刊物名称
            <input value={form.journal} onChange={(e) => set('journal', e.target.value)} />
          </label>
          <label>
            卷
            <input value={form.volume} onChange={(e) => set('volume', e.target.value)} placeholder="42" />
          </label>
          <label>
            期
            <input value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="2" />
          </label>
          <label>
            页码
            <input value={form.pages} onChange={(e) => set('pages', e.target.value)} placeholder="352-361" />
          </label>
          <label>
            当年影响因子
            <input
              value={form.impactFactor}
              onChange={(e) => set('impactFactor', e.target.value)}
              placeholder="中文刊可留空"
            />
          </label>
          <label>
            中科院分区
            <input value={form.cas} onChange={(e) => set('cas', e.target.value)} placeholder="如 医学3区" />
          </label>
          <label>
            收录情况
            <input value={form.indexing} onChange={(e) => set('indexing', e.target.value)} placeholder="SCI收录" />
          </label>
          <label>
            第一作者
            <input value={form.firstAuthor} onChange={(e) => set('firstAuthor', e.target.value)} />
          </label>
          <label>
            通讯作者
            <input
              value={form.correspondingAuthor}
              onChange={(e) => set('correspondingAuthor', e.target.value)}
            />
          </label>
          <label className="full">
            全部作者
            <textarea
              rows={2}
              value={form.authors}
              onChange={(e) => set('authors', e.target.value)}
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.coFirst}
              onChange={(e) => set('coFirst', e.target.checked)}
            />
            是否共一
          </label>
          <label>
            本人排名
            <input
              type="number"
              min={1}
              value={form.rank ?? ''}
              onChange={(e) => set('rank', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <label>
            总人数
            <input
              type="number"
              min={1}
              value={form.totalAuthors ?? ''}
              onChange={(e) =>
                set('totalAuthors', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </label>
          <label>
            引用次数
            <input value={form.citations} onChange={(e) => set('citations', e.target.value)} />
          </label>
          <label className="full">
            本人主要贡献
            <textarea
              rows={3}
              value={form.myContribution}
              onChange={(e) => set('myContribution', e.target.value)}
            />
          </label>
          <label className="full">
            Pubmed
            <input value={form.pubmed} onChange={(e) => set('pubmed', e.target.value)} />
          </label>
          <label className="full">
            全文 PDF 路径
            <input value={form.pdfFull} onChange={(e) => set('pdfFull', e.target.value)} />
          </label>
          <label className="full">
            首页 PDF 路径
            <input value={form.pdfFirst} onChange={(e) => set('pdfFirst', e.target.value)} />
          </label>
          <div className="full row-actions">
            <button type="button" className="btn secondary" onClick={fillPdfNames}>
              按规则生成 PDF 文件名
            </button>
            <button type="button" className="btn secondary" onClick={regenRis}>
              重新生成 RIS
            </button>
          </div>
          <label className="full">
            RIS（Zotero）
            <textarea rows={8} value={form.ris} onChange={(e) => set('ris', e.target.value)} />
          </label>
          <div className="full row-actions end">
            <button type="button" className="btn ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
