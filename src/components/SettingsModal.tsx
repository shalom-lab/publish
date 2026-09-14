import type { GithubSettings } from '../types'
import { saveSettings, TOKEN_KEY, writeToken } from '../lib/github'

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
        <p className="hint">
          Token 保存在 <code>localStorage[{TOKEN_KEY}]</code>。也可由扩展/脚本预先注入该键。需 Contents 读写权限。
          清除 Token 即退出：页面上的论文会被清空，需重新粘贴 Token 才能查看。
        </p>
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
        <p className="hint warn">请勿截图或分享含 Token 的界面。</p>
      </div>
    </div>
  )
}
