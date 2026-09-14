import type { Publication } from '../types'
import { resolveYear } from './pdfName'

function splitAuthors(authors: string): string[] {
  if (!authors.trim()) return []
  return authors
    .replace(/，/g, ',')
    .replace(/；/g, ';')
    .split(/[,;]/)
    .map((a) => a.trim())
    .filter(Boolean)
}

/** Convert "Shaolong Ren" -> "Ren, Shaolong"; keep Chinese as-is. */
function toRisAuthor(name: string): string {
  if (/[\u4e00-\u9fff]/.test(name)) return name
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last}, ${first}`
}

export function generateRis(pub: Publication): string {
  const lines: string[] = ['TY  - JOUR']
  if (pub.title) lines.push(`TI  - ${pub.title}`)
  for (const a of splitAuthors(pub.authors)) {
    lines.push(`AU  - ${toRisAuthor(a)}`)
  }
  if (pub.journal) lines.push(`JO  - ${pub.journal}`)
  const year = resolveYear(pub)
  if (year && year !== 'XXXX') lines.push(`PY  - ${year}`)
  if (pub.date) {
    const m = pub.date.match(/(\d{4})\/(\d{1,2})/)
    if (m) lines.push(`DA  - ${m[1]}/${m[2].padStart(2, '0')}/01`)
  }
  if (pub.volume) lines.push(`VL  - ${pub.volume}`)
  if (pub.issue) lines.push(`IS  - ${pub.issue}`)
  if (pub.pages) {
    const sp = pub.pages.split(/[-–—]/)[0]?.trim()
    if (sp) lines.push(`SP  - ${sp}`)
    const ep = pub.pages.split(/[-–—]/)[1]?.trim()
    if (ep) lines.push(`EP  - ${ep}`)
  }
  if (pub.pubmed) lines.push(`UR  - ${pub.pubmed}`)
  if (pub.impactFactor) lines.push(`N1  - Impact Factor: ${pub.impactFactor}`)
  if (pub.cas) lines.push(`N1  - CAS: ${pub.cas}`)
  lines.push('ER  - ')
  return lines.join('\r\n')
}

export function ensureRis(pub: Publication): Publication {
  if (pub.ris?.trim()) return pub
  return { ...pub, ris: generateRis(pub) }
}
