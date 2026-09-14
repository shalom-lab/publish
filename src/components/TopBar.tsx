import type { GithubSettings } from '../types'

interface Props {
  settings: GithubSettings
  onOpenSettings: () => void
}

export function repoUrl(settings: GithubSettings): string {
  const owner = settings.owner || 'shalom-lab'
  const repo = settings.repo || 'publish'
  return `https://github.com/${owner}/${repo}`
}

export function TopBar({ settings, onOpenSettings }: Props) {
  const href = repoUrl(settings)

  return (
    <div className="top-bar">
      <a className="btn ghost top-bar-link" href={href} target="_blank" rel="noreferrer">
        GitHub 仓库
      </a>
      <button type="button" className="btn secondary" onClick={onOpenSettings}>
        设置
      </button>
    </div>
  )
}
