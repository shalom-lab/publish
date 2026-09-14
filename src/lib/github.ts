import type { GithubSettings } from '../types'
import { DATA_PATH } from '../types'

const SETTINGS_KEY = 'publish_github_settings'

export function loadSettings(): GithubSettings {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw) as GithubSettings
  } catch {
    /* ignore */
  }
  return { owner: '', repo: 'publish', token: '', branch: 'main' }
}

export function saveSettings(settings: GithubSettings): void {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export interface FileContentResult {
  content: string
  sha: string
}

export async function getFileContent(
  settings: GithubSettings,
  path: string = DATA_PATH,
): Promise<FileContentResult> {
  const { owner, repo, token, branch } = settings
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`读取失败 (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { content: string; encoding: string; sha: string }
  const decoded = decodeURIComponent(
    atob(data.content.replace(/\n/g, ''))
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return { content: decoded, sha: data.sha }
}

export async function putFileContent(
  settings: GithubSettings,
  content: string,
  sha: string,
  message: string,
  path: string = DATA_PATH,
): Promise<string> {
  const { owner, repo, token, branch } = settings
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const encoded = btoa(
    encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  )
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: encoded,
      sha,
      branch,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`写入失败 (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { content: { sha: string } }
  return data.content.sha
}

export async function savePublicationsJson(
  settings: GithubSettings,
  data: unknown,
  sha: string | null,
): Promise<string> {
  const content = JSON.stringify(data, null, 2) + '\n'
  let currentSha = sha
  if (!currentSha) {
    const file = await getFileContent(settings)
    currentSha = file.sha
  }
  return putFileContent(settings, content, currentSha, 'chore: update publications.json via BYOK')
}
