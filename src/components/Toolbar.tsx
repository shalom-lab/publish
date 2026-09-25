import { ColumnToggle } from './ColumnToggle'
import type { ColumnDef, PublicationKey } from '../types'

interface Props {
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  pinned: Set<PublicationKey>
  onToggleColumn: (key: PublicationKey) => void
  onTogglePin: (key: PublicationKey) => void
  onReorderColumns: (from: number, to: number) => void
  onAdd: () => void
  onSaveRemote: () => void
  onExportExcel: () => void
  onCopyCsv: () => void
  onDownloadFullPdfs: () => void
  onDownloadFirstPdfs: () => void
  onDownloadRis: () => void
  onCopyRis: () => void
  onSelectAll: () => void
  saving: boolean
  canSave: boolean
  dirty: boolean
  selectedCount: number
  totalCount: number
}

export function Toolbar({
  columns,
  visible,
  pinned,
  onToggleColumn,
  onTogglePin,
  onReorderColumns,
  onAdd,
  onSaveRemote,
  onExportExcel,
  onCopyCsv,
  onDownloadFullPdfs,
  onDownloadFirstPdfs,
  onDownloadRis,
  onCopyRis,
  onSelectAll,
  saving,
  canSave,
  dirty,
  selectedCount,
  totalCount,
}: Props) {
  const hasSelection = selectedCount > 0
  const allSelected = totalCount > 0 && selectedCount === totalCount
  const remoteDisabled = !canSave || saving || !dirty
  const remoteTitle = !canSave
    ? '请先配置 BYOK'
    : saving
      ? '正在写入 GitHub…'
      : dirty
        ? '将本地改动写入 GitHub'
        : '没有未同步的改动'

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button type="button" className="btn primary" onClick={onAdd}>
          新增
        </button>
        <button
          type="button"
          className={`btn ${dirty ? 'primary' : 'secondary'}`}
          onClick={onSaveRemote}
          disabled={remoteDisabled}
          title={remoteTitle}
        >
          {saving ? '保存中…' : dirty ? '保存到 GitHub' : '已同步'}
        </button>
      </div>
      <div className="toolbar-group">
        <button
          type="button"
          className="btn secondary"
          onClick={onSelectAll}
          disabled={totalCount === 0}
          title={allSelected ? '取消全选' : '选中当前列表全部论文'}
        >
          {allSelected ? '取消全选' : '全部选中'}
        </button>
        <button type="button" className="btn secondary" onClick={onCopyCsv} disabled={!hasSelection}>
          复制 CSV
        </button>
        <button type="button" className="btn secondary" onClick={onExportExcel} disabled={!hasSelection}>
          下载 Excel
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadFullPdfs} disabled={!hasSelection}>
          下载全文 PDF
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadFirstPdfs} disabled={!hasSelection}>
          下载首页 PDF
        </button>
        <button type="button" className="btn secondary" onClick={onCopyRis} disabled={!hasSelection}>
          复制 RIS
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadRis} disabled={!hasSelection}>
          下载 RIS
        </button>
      </div>
      <div className="toolbar-group toolbar-end">
        <span className="select-count">{hasSelection ? `已选 ${selectedCount} / ${totalCount}` : `已选 0 / ${totalCount}`}</span>
        <ColumnToggle
          columns={columns}
          visible={visible}
          pinned={pinned}
          onToggle={onToggleColumn}
          onTogglePin={onTogglePin}
          onReorder={onReorderColumns}
        />
      </div>
    </div>
  )
}
