import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthGate } from './components/AuthGate'
import { ColumnToggle } from './components/ColumnToggle'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EditForm } from './components/EditForm'
import { PubTable } from './components/PubTable'
import type { SortDir } from './components/PubTable'
import { SettingsModal } from './components/SettingsModal'
import { ToastHost, toast } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { TopBar } from './components/TopBar'
import {
  columnsInOrder,
  loadColumnPrefs,
  saveColumnPrefs,
} from './lib/columnPrefs'
import { downloadAllRis, downloadPdfZip, exportExcel, publicationsToCsv, publicationsToRis } from './lib/export'
import { copyText } from './lib/copy'
import {
  loadPublicationsJson,
  loadSettings,
  readToken,
  savePublicationsJson,
  saveSettings,
  writeToken,
} from './lib/github'
import { createEmptyPublication, dateSortKey, lastAuthor, splitPubmedAndOnline, defaultFirstAuthorRank, syncDerivedFields } from './lib/publication'
import type { GithubSettings, Publication, PublicationKey } from './types'
import { DATA_PATH } from './types'

type LegacyPublication = Publication & { totalAuthors?: number | null }

function normalizePublication(raw: LegacyPublication): Publication {
  const base = createEmptyPublication()
  const { totalAuthors: legacyTotal, ...rest } = raw
  const date = (rest.date || '').replace(/^(\d{4})\/(\d{1,2})$/, (_, y, m) => `${y}-${String(m).padStart(2, '0')}`)
  const authorTotal = rest.authorTotal ?? legacyTotal ?? null
  const links = splitPubmedAndOnline(rest.pubmed || '', rest.online || '')
  let correspondingAuthor = (rest.correspondingAuthor || '').trim()
  if (!correspondingAuthor || /[;；,]/.test(correspondingAuthor)) {
    correspondingAuthor = lastAuthor(rest.authors || '') || correspondingAuthor.split(/[;；,]/).pop()?.trim() || ''
  }
  const merged: Publication = {
    ...base,
    ...rest,
    date,
    authorTotal,
    ...links,
    correspondingAuthor,
    isFirstAuthor: raw.isFirstAuthor ?? raw.rank === 1,
    isCorresponding: raw.isCorresponding ?? false,
    coFirst: raw.coFirst ?? false,
    volume: raw.volume ?? '',
    issue: raw.issue ?? '',
    pages: raw.pages ?? '',
    firstAuthorRank: raw.firstAuthorRank || '',
  }
  merged.firstAuthorRank = defaultFirstAuthorRank(merged)
  return syncDerivedFields(merged)
}

function comparePubs(a: Publication, b: Publication, key: PublicationKey, dir: SortDir): number {
  const mul = dir === 'asc' ? 1 : -1
  if (key === 'date' || key === 'year') {
    const ka = dateSortKey(a.date, a.year)
    const kb = dateSortKey(b.date, b.year)
    return mul * ka.localeCompare(kb)
  }
  if (key === 'rank' || key === 'authorTotal') {
    const na = a[key] ?? -1
    const nb = b[key] ?? -1
    return mul * (Number(na) - Number(nb))
  }
  if (key === 'impactFactor' || key === 'citations') {
    const na = parseFloat(String(a[key] || '')) || -1
    const nb = parseFloat(String(b[key] || '')) || -1
    return mul * (na - nb)
  }
  if (key === 'coFirst' || key === 'isFirstAuthor' || key === 'isCorresponding') {
    return mul * (Number(a[key]) - Number(b[key]))
  }
  const sa = String(a[key] ?? '')
  const sb = String(b[key] ?? '')
  return mul * sa.localeCompare(sb, 'zh-CN')
}

export default function App() {
  const [settings, setSettings] = useState<GithubSettings>(() => loadSettings())
  const [unlocked, setUnlocked] = useState(() => Boolean(readToken()))
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<Publication | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [columnOrder, setColumnOrder] = useState<PublicationKey[]>(() => loadColumnPrefs().order)
  const [visible, setVisible] = useState<Set<PublicationKey>>(() => {
    return new Set(loadColumnPrefs().visible)
  })
  const [pinned, setPinned] = useState<PublicationKey[]>(() => loadColumnPrefs().pinned)
  const orderedColumns = useMemo(() => columnsInOrder(columnOrder), [columnOrder])
  const pinnedSet = useMemo(() => new Set(pinned), [pinned])
  const [saving, setSaving] = useState(false)
  const [fileSha, setFileSha] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [sortKey, setSortKey] = useState<PublicationKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [pendingDelete, setPendingDelete] = useState<Publication | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const fetchData = useCallback(async (s: GithubSettings) => {
    if (!s.token) {
      setUnlocked(false)
      setPublications([])
      setFileSha(null)
      return
    }
    setLoading(true)
    try {
      const { publications: raw, sha } = await loadPublicationsJson(s)
      if (!Array.isArray(raw)) throw new Error('数据格式错误：应为数组')
      setPublications((raw as Publication[]).map(normalizePublication))
      setFileSha(sha)
      setDirty(false)
      setUnlocked(true)
      toast('已通过 BYOK 加载数据')
    } catch (err) {
      setPublications([])
      setFileSha(null)
      toast(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    if (s.token) void fetchData(s)
  }, [fetchData])

  const sortedPublications = useMemo(
    () => [...publications].sort((a, b) => comparePubs(a, b, sortKey, sortDir)),
    [publications, sortKey, sortDir],
  )

  const selectedPublications = useMemo(
    () => sortedPublications.filter((p) => selectedIds.has(p.id)),
    [sortedPublications, selectedIds],
  )

  useEffect(() => {
    const valid = new Set(publications.map((p) => p.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [publications])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const ids = sortedPublications.map((p) => p.id)
    const allOn = ids.length > 0 && ids.every((id) => selectedIds.has(id))
    setSelectedIds(allOn ? new Set() : new Set(ids))
  }

  const handleSort = (key: PublicationKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'date' || key === 'year' || key === 'impactFactor' ? 'desc' : 'asc')
    }
  }

  const canSave = Boolean(settings.owner && settings.repo && settings.token && unlocked)

  const persistColumnPrefs = useCallback(
    (order: PublicationKey[], vis: Set<PublicationKey>, pins: PublicationKey[]) => {
      saveColumnPrefs({ order, visible: [...vis], pinned: pins })
    },
    [],
  )

  const toggleColumn = (key: PublicationKey) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persistColumnPrefs(columnOrder, next, pinned)
      return next
    })
  }

  const togglePin = (key: PublicationKey) => {
    setPinned((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      persistColumnPrefs(columnOrder, visible, next)
      return next
    })
  }

  const reorderColumns = (from: number, to: number) => {
    setColumnOrder((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      persistColumnPrefs(next, visible, pinned)
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
    setPendingDelete(null)
    toast('已删除（记得保存到 GitHub）')
  }

  const requestDelete = (id: string) => {
    const pub = publications.find((p) => p.id === id) ?? null
    setPendingDelete(pub)
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
      toast(`已写入 GitHub: ${DATA_PATH}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const lockSession = () => {
    writeToken('')
    saveSettings({ ...settings, token: '' })
    setSettings((s) => ({ ...s, token: '' }))
    setUnlocked(false)
    setPublications([])
    setFileSha(null)
    setDirty(false)
    setSelectedIds(new Set())
    toast('已清除 Token，页面数据已清空')
  }

  const stats = useMemo(() => {
    const total = publications.length
    const first = publications.filter((p) => p.rank === 1).length
    const sci = publications.filter((p) => /SCI/i.test(p.indexing)).length
    return { total, first, sci }
  }, [publications])

  if (!unlocked) {
    return (
      <div className="app">
        <TopBar settings={settings} onOpenSettings={() => setSettingsOpen(true)} />
        <AuthGate
          settings={settings}
          onUnlocked={(s) => {
            setSettings(s)
            void fetchData(s)
          }}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <SettingsModal
          open={settingsOpen}
          settings={settings}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
          onClearToken={lockSession}
          onSaved={(s) => {
            if (s.token) void fetchData(s)
          }}
        />
        <ToastHost />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar settings={settings} onOpenSettings={() => setSettingsOpen(true)} />
      <header className="hero">
        <div>
          <p className="eyebrow">Publication Manager · BYOK</p>
          <h1>发表论文管理</h1>
          <p className="sub">数据仅在本地 Token 鉴权后经 GitHub API 加载，页面不托管论文 JSON。</p>
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
        columns={orderedColumns}
        visible={visible}
        pinned={pinnedSet}
        onToggleColumn={toggleColumn}
        onTogglePin={togglePin}
        onReorderColumns={reorderColumns}
        onAdd={() => {
          setEditing(createEmptyPublication())
          setEditOpen(true)
        }}
        onSaveRemote={handleSaveRemote}
        onSelectAll={toggleSelectAll}
        selectedCount={selectedPublications.length}
        totalCount={sortedPublications.length}
        onExportExcel={() => {
          if (!selectedPublications.length) return
          exportExcel(selectedPublications)
          toast(`Excel 已下载（${selectedPublications.length} 篇）`)
        }}
        onCopyCsv={async () => {
          if (!selectedPublications.length) return
          const csv = publicationsToCsv(selectedPublications)
          const ok = await copyText(csv)
          toast(ok ? '复制成功' : '复制失败')
        }}
        onDownloadFullPdfs={async () => {
          if (!selectedPublications.length) return
          try {
            const r = await downloadPdfZip(selectedPublications, 'full', 'pdfs-full.zip', settings)
            toast(`全文 PDF：成功 ${r.ok}，缺失 ${r.missing}`)
          } catch (err) {
            toast(err instanceof Error ? err.message : '下载失败')
          }
        }}
        onDownloadFirstPdfs={async () => {
          if (!selectedPublications.length) return
          try {
            const r = await downloadPdfZip(selectedPublications, 'first', 'pdfs-first.zip', settings)
            toast(`首页 PDF：成功 ${r.ok}，缺失 ${r.missing}`)
          } catch (err) {
            toast(err instanceof Error ? err.message : '下载失败')
          }
        }}
        onCopyRis={async () => {
          if (!selectedPublications.length) return
          const text = publicationsToRis(selectedPublications)
          if (!text) {
            toast('选中条目没有 RIS')
            return
          }
          const ok = await copyText(text)
          toast(ok ? '复制成功' : '复制失败')
        }}
        onDownloadRis={() => {
          if (!selectedPublications.length) return
          downloadAllRis(selectedPublications)
          toast(`RIS 已下载（${selectedPublications.length} 篇）`)
        }}
        saving={saving}
        canSave={canSave}
        dirty={dirty}
      />

      <div className="toolbar-extra">
        <button type="button" className="btn ghost" onClick={() => void fetchData(settings)}>
          重新加载
        </button>
      </div>

      <div className="mobile-only">
        <ColumnToggle
          columns={orderedColumns}
          visible={visible}
          pinned={pinnedSet}
          onToggle={toggleColumn}
          onTogglePin={togglePin}
          onReorder={reorderColumns}
        />
      </div>

      {loading ? (
        <p className="loading">正在通过 GitHub API 加载…</p>
      ) : (
        <PubTable
          publications={sortedPublications}
          columns={orderedColumns}
          visible={visible}
          pinned={pinned}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onTogglePin={togglePin}
          onEdit={(pub) => {
            setEditing(pub)
            setEditOpen(true)
          }}
          onDelete={requestDelete}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      <footer className="footer">
        <p>
          数据文件：<code>{DATA_PATH}</code>（不进入 Pages 静态资源）。Token 键：
          <code>gh-token-publish</code>
        </p>
      </footer>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="确认删除这篇论文？"
        message="删除后可在「保存到 GitHub」前通过重新加载恢复（未同步时）。"
        detail={pendingDelete?.title}
        confirmLabel="确认删除"
        cancelLabel="再想想"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete.id)
        }}
      />

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
        onClearToken={lockSession}
        onSaved={(s) => {
          if (!s.token) {
            setUnlocked(false)
            setPublications([])
          } else {
            void fetchData(s)
          }
        }}
      />
      <ToastHost />
    </div>
  )
}
