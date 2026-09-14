import type { GithubSettings } from '../types'
import { saveSettings } from '../lib/github'

interface Props {
  open: boolean
  settings: GithubSettings
  onChange: (s: GithubSettings) => void
  onClose: () => void
}

export function SettingsModal({ open, settings, onChange, onClose }: Props) {
  if (!open) return null

  const update = (patch: Partial<GithubSettings>) => {
    const next = { ...settings, ...patch }
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
          Token 仅保存在当前浏览器 sessionStorage，刷新标签页后需重新填写。需要具备仓库 Contents 写权限（classic PAT 勾选
          repo，或 fine-grained 授权 Contents: Read and write）。
        </p>
        <div className="form-grid">
          <label>
            Owner（用户名或组织）
            <input
              value={settings.owner}
              onChange={(e) => update({ owner: e.target.value.trim() })}
              placeholder="your-github-username"
            />
          </label>
          <label>
            仓库名
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
        <p className="hint warn">请勿截图或分享含 Token 的界面。</p>
      </div>
    </div>
  )
}
