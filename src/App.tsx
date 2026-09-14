import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnToggle } from './components/ColumnToggle'
import { EditForm } from './components/EditForm'
import { PubTable } from './components/PubTable'
import { SettingsModal } from './components/SettingsModal'
import { ToastHost, toast } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { COLUMNS } from './lib/columns'
import {
  downloadAllRis,
  downloadPdfZip,
  exportExcel,
} from './lib/export'
import { loadSettings, savePublicationsJson } from './lib/github'
import { createEmptyPublication } from './lib/publication'
import type { GithubSettings, Publication, PublicationKey } from './types'

function defaultVisible(): Set<PublicationKey> {
  return new Set(COLUMNS.filter((c) => c.defaultVisible !== false).map((c) => c.key))
}

export default function App() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<GithubSettings>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<Publication | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [visible, setVisible] = useState<Set<PublicationKey>>(defaultVisible)
  const [saving, setSaving] = useState(false)
  const [fileSha, setFileSha] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/publications.json`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data: Publication[]) => {
        const sorted = [...data].sort((a, b) => {
          const ya = a.year || a.date || ''
          const yb = b.year || b.date || ''
          return yb.localeCompare(ya) || (b.date || '').localeCompare(a.date || '')
        })
        setPublications(sorted)
      })
      .catch(() => toast('加载 publications.json 失败'))
      .finally(() => setLoading(false))
  }, [])

  const canSave = Boolean(settings.owner && settings.repo && settings.token)

  const toggleColumn = (key: PublicationKey) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const markDirty = useCallback((next: Publication[]) => {
    setPublications(next)
    setDirty(true)
  }, [])

  const handleSaveLocal = (pub: Publication) => {
    const exists = publications.some((p) => p.id === pub.id)
    const next = exists
      ? publications.map((p) => (p.id === pub.id ? pub : p))
      : [pub, ...publications]
    markDirty(next)
    setEditOpen(false)
    setEditing(null)
    toast(exists ? '已更新（记得保存到 GitHub）' : '已新增（记得保存到 GitHub）')
  }

  const handleDelete = (id: string) => {
    markDirty(publications.filter((p) => p.id !== id))
    toast('已删除（记得保存到 GitHub）')
  }

  const handleSaveRemote = async () => {
    if (!canSave) {
      setSettingsOpen(true)
      toast('请先配置 BYOK')
      return
    }
    setSaving(true)
    try {
      const sha = await savePublicationsJson(settings, publications, fileSha)
      setFileSha(sha)
      setDirty(false)
      toast('已写入 GitHub: public/data/publications.json')
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const total = publications.length
    const first = publications.filter((p) => p.rank === 1).length
    const sci = publications.filter((p) => /SCI/i.test(p.indexing)).length
    return { total, first, sci }
  }, [publications])

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Publication Manager</p>
          <h1>发表论文管理</h1>
          <p className="sub">
            细粒度记录 · 单元格一键复制 · BYOK 写回 GitHub · PDF / Excel / RIS 导出
          </p>
        </div>
        <div className="stats">
          <div>
            <strong>{stats.total}</strong>
            <span>篇</span>
          </div>
          <div>
            <strong>{stats.first}</strong>
            <span>一作</span>
          </div>
          <div>
            <strong>{stats.sci}</strong>
            <span>SCI</span>
          </div>
          {dirty && <div className="dirty-badge">未同步</div>}
        </div>
      </header>

      <Toolbar
        columns={COLUMNS}
        visible={visible}
        onToggleColumn={toggleColumn}
        onAdd={() => {
          setEditing(createEmptyPublication())
          setEditOpen(true)
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onSaveRemote={handleSaveRemote}
        onExportExcel={() => {
          exportExcel(publications)
          toast('Excel 已下载')
        }}
        onDownloadFullPdfs={async () => {
          try {
            const r = await downloadPdfZip(publications, 'full', 'pdfs-full.zip')
            toast(`全文 PDF：成功 ${r.ok}，缺失 ${r.missing}`)
          } catch (err) {
            toast(err instanceof Error ? err.message : '下载失败')
          }
        }}
        onDownloadFirstPdfs={async () => {
          try {
            const r = await downloadPdfZip(publications, 'first', 'pdfs-first.zip')
            toast(`首页 PDF：成功 ${r.ok}，缺失 ${r.missing}`)
          } catch (err) {
            toast(err instanceof Error ? err.message : '下载失败')
          }
        }}
        onDownloadAllRis={() => {
          downloadAllRis(publications)
          toast('RIS 已下载')
        }}
        saving={saving}
        canSave={canSave}
      />

      {/* ColumnToggle also in toolbar; keep mobile-friendly duplicate via details already */}
      <div className="mobile-only">
        <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggleColumn} />
      </div>

      {loading ? (
        <p className="loading">加载中…</p>
      ) : (
        <PubTable
          publications={publications}
          columns={COLUMNS}
          visible={visible}
          onEdit={(pub) => {
            setEditing(pub)
            setEditOpen(true)
          }}
          onDelete={handleDelete}
        />
      )}

      <footer className="footer">
        <p>
          PDF 命名：
          <code>{'{第一作者}_{年份}_{杂志}_{标题截断}__full|first.pdf'}</code>
          ，放入 <code>public/paper/</code>
        </p>
      </footer>

      <EditForm
        open={editOpen}
        initial={editing}
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        onSave={handleSaveLocal}
      />
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />
      <ToastHost />
    </div>
  )
}
