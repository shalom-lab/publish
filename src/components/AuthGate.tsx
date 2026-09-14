import { useState } from 'react'
import type { GithubSettings } from '../types'
import { saveSettings, TOKEN_KEY } from '../lib/github'

interface Props {
  settings: GithubSettings
  onUnlocked: (settings: GithubSettings) => void
  onOpenSettings: () => void
}

export function AuthGate({ settings, onUnlocked, onOpenSettings }: Props) {
  const [token, setToken] = useState(settings.token || '')
  const [busy, setBusy] = useState(false)

  const unlock = () => {
    const t = token.trim()
    if (!t) return
    setBusy(true)
    const next = { ...settings, token: t }
    saveSettings(next)
    onUnlocked(next)
    setBusy(false)
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <div className="auth-lock" aria-hidden>
          <span className="auth-lock-shackle" />
          <span className="auth-lock-body" />
        </div>
        <h1>发表记录已锁定</h1>
        <p className="auth-desc">
          未配置 BYOK 时不加载、不展示任何论文数据。可预先注入 Token，或在下方粘贴后解锁。
        </p>
        <p className="auth-key">
          localStorage 键：<code>{TOKEN_KEY}</code>
        </p>
        <label className="auth-label">
          GitHub Token
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') unlock()
            }}
            placeholder="ghp_… 或 github_pat_…"
          />
        </label>
        <div className="auth-actions">
          <button type="button" className="btn primary" disabled={!token.trim() || busy} onClick={unlock}>
            解锁并加载
          </button>
          <button type="button" className="btn ghost" onClick={onOpenSettings}>
            仓库设置
          </button>
        </div>
        <p className="hint">
          当前仓库：{settings.owner}/{settings.repo}@{settings.branch}
        </p>
      </div>
    </div>
  )
}
