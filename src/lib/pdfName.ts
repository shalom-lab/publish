import type { Publication } from '../types'

/** Strip chars unsafe for filenames; keep CJK and word chars. */
export function sanitizeSegment(input: string, maxLen: number): string {
  const cleaned = input
    .trim()
    .replace(/[^\w\u4e00-\u9fff]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return cleaned.slice(0, maxLen) || 'NA'
}

export function parseFirstAuthor(authors: string): string {
  if (!authors.trim()) return ''
  const normalized = authors.replace(/，/g, ',').replace(/；/g, ';')
  const first = normalized.split(/[,;]/)[0]?.trim() ?? ''
  return first
}

export function resolveFirstAuthor(pub: Pick<Publication, 'firstAuthor' | 'authors'>): string {
  return (pub.firstAuthor || parseFirstAuthor(pub.authors) || 'Unknown').trim()
}

export function resolveYear(pub: Pick<Publication, 'year' | 'date'>): string {
  if (pub.year) return String(pub.year)
  const m = pub.date?.match(/(\d{4})/)
  return m?.[1] ?? 'XXXX'
}

/** Basename without __full/__first suffix. */
export function buildPdfBasename(pub: Pick<Publication, 'firstAuthor' | 'authors' | 'year' | 'date' | 'journal' | 'title'>): string {
  const author = resolveFirstAuthor(pub).replace(/\s+/g, '_')
  const year = resolveYear(pub)
  const journal = sanitizeSegment(pub.journal || 'Journal', 20)
  const title = sanitizeSegment(pub.title || 'Untitled', 40)
  return `${author}_${year}_${journal}_${title}`
}

export function buildPdfPaths(pub: Pick<Publication, 'firstAuthor' | 'authors' | 'year' | 'date' | 'journal' | 'title'>): {
  pdfFull: string
  pdfFirst: string
} {
  const base = buildPdfBasename(pub)
  return {
    pdfFull: `paper/${base}__full.pdf`,
    pdfFirst: `paper/${base}__first.pdf`,
  }
}

export function assetUrl(relativePath: string): string {
  if (!relativePath) return ''
  const base = import.meta.env.BASE_URL
  const path = relativePath.replace(/^\//, '')
  return `${base}${path}`
}
