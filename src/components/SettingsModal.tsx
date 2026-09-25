import type { GithubSettings } from '../types'
import { saveSettings, writeToken } from '../lib/github'

interface Props {
  open: boolean
  settings: GithubSettings
  onChange: (s: GithubSettings) => void
  onClose: () => void
  onSaved?: (s: GithubSettings) => void
  onClearToken?: () => void
}

export function SettingsModal({ open, settings, onChange, onClose, onSaved, onClearToken }: Props) {
  if (!open) return null

  const update = (patch: Partial<GithubSettings>) => {
    const next = { ...settings, ...patch }
    onChange(next)
    saveSettings(next)
  }

  const clearToken = () => {
    onClose()
    if (onClearToken) {
      onClearToken()
      return
    }
    writeToken('')
    const next = { ...settings, token: '' }
    onChange(next)
    saveSettings(next)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>BYOK 设置</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="form-grid">
          <label>
            Owner
            <input
              value={settings.owner}
              onChange={(e) => update({ owner: e.target.value.trim() })}
              placeholder="shalom-lab"
            />
          </label>
          <label>
            仓库
            <input
              value={settings.repo}
              onChange={(e) => update({ repo: e.target.value.trim() })}
              placeholder="publish"
            />
          </label>
          <label>
            分支
            <input
              value={settings.branch}
              onChange={(e) => update({ branch: e.target.value.trim() })}
              placeholder="main"
            />
          </label>
          <label className="full">
            GitHub Personal Access Token
            <input
              type="password"
              autoComplete="off"
              value={settings.token}
              onChange={(e) => update({ token: e.target.value.trim() })}
              placeholder="ghp_..."
            />
          </label>
        </div>
        <div className="row-actions end" style={{ marginTop: 12 }}>
          <button type="button" className="btn ghost" onClick={clearToken} disabled={!settings.token}>
            清除 Token
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              saveSettings(settings)
              onSaved?.(settings)
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
