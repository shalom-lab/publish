import type { GithubSettings } from '../types'
import { DATA_PATH } from '../types'

/** User-injected PAT key (localStorage). */
export const TOKEN_KEY = 'gh-token-publish'
const META_KEY = 'publish_github_meta'

const DEFAULT_META = {
  owner: 'shalom-lab',
  repo: 'publish',
  branch: 'main',
}

export function readToken(): string {
  try {
    return (localStorage.getItem(TOKEN_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function writeToken(token: string): void {
  const t = token.trim()
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

export function loadSettings(): GithubSettings {
  let meta = { ...DEFAULT_META }
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) meta = { ...meta, ...(JSON.parse(raw) as typeof DEFAULT_META) }
  } catch {
    /* ignore */
  }
  return {
    owner: meta.owner || DEFAULT_META.owner,
    repo: meta.repo || DEFAULT_META.repo,
    branch: meta.branch || DEFAULT_META.branch,
    token: readToken(),
  }
}

export function saveSettings(settings: GithubSettings): void {
  writeToken(settings.token)
  localStorage.setItem(
    META_KEY,
    JSON.stringify({
      owner: settings.owner.trim(),
      repo: settings.repo.trim(),
      branch: settings.branch.trim() || 'main',
    }),
  )
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function shortErr(status: number, body: string): string {
  const clipped = body.replace(/\s+/g, ' ').slice(0, 180)
  if (status === 401 || status === 403) return `鉴权失败 (${status})，请检查 Token 权限`
  if (status === 404) return `未找到文件 (${status})，请检查仓库路径 ${DATA_PATH}`
  return `请求失败 (${status}): ${clipped}`
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
  if (!token) throw new Error('缺少 Token')
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(shortErr(res.status, await res.text()))
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
  if (!token) throw new Error('缺少 Token')
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
  if (!res.ok) throw new Error(shortErr(res.status, await res.text()))
  const data = (await res.json()) as { content: { sha: string } }
  return data.content.sha
}

export async function loadPublicationsJson(
  settings: GithubSettings,
): Promise<{ publications: unknown; sha: string }> {
  const file = await getFileContent(settings)
  const parsed = JSON.parse(file.content) as unknown
  return { publications: parsed, sha: file.sha }
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
  try {
    return await putFileContent(settings, content, currentSha, 'chore: update publications.json via BYOK')
  } catch (err) {
    // 409: refresh sha and retry once
    const msg = err instanceof Error ? err.message : ''
    if (!msg.includes('(409)')) throw err
    const file = await getFileContent(settings)
    return putFileContent(settings, content, file.sha, 'chore: update publications.json via BYOK')
  }
}
