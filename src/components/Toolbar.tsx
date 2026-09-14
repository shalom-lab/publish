import { ColumnToggle } from './ColumnToggle'
import type { ColumnDef, PublicationKey } from '../types'

interface Props {
  columns: ColumnDef[]
  visible: Set<PublicationKey>
  onToggleColumn: (key: PublicationKey) => void
  onAdd: () => void
  onSaveRemote: () => void
  onExportExcel: () => void
  onCopyAllCsv: () => void
  onDownloadFullPdfs: () => void
  onDownloadFirstPdfs: () => void
  onDownloadAllRis: () => void
  saving: boolean
  canSave: boolean
}

export function Toolbar({
  columns,
  visible,
  onToggleColumn,
  onAdd,
  onSaveRemote,
  onExportExcel,
  onCopyAllCsv,
  onDownloadFullPdfs,
  onDownloadFirstPdfs,
  onDownloadAllRis,
  saving,
  canSave,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button type="button" className="btn primary" onClick={onAdd}>
          新增
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={onSaveRemote}
          disabled={!canSave || saving}
        >
          {saving ? '保存中…' : '保存到 GitHub'}
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn secondary" onClick={onCopyAllCsv}>
          复制全部 CSV
        </button>
        <button type="button" className="btn secondary" onClick={onExportExcel}>
          下载 Excel
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadFullPdfs}>
          下载全部全文 PDF
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadFirstPdfs}>
          下载全部首页 PDF
        </button>
        <button type="button" className="btn secondary" onClick={onDownloadAllRis}>
          下载全部 RIS
        </button>
      </div>
      <ColumnToggle columns={columns} visible={visible} onToggle={onToggleColumn} />
    </div>
  )
}
