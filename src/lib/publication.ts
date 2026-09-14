import type { Publication } from '../types'
import { buildPdfPaths } from './pdfName'
import { generateRis } from './ris'

export function splitAuthorList(authors: string): string[] {
  if (!authors.trim()) return []
  return authors
    .replace(/，/g, ',')
    .replace(/；/g, ';')
    .split(/[,;]/)
    .map((a) => a.trim())
    .filter(Boolean)
}

export function lastAuthor(authors: string): string {
  const list = splitAuthorList(authors)
  return list[list.length - 1] ?? ''
}

export function rankDisplay(pub: Pick<Publication, 'rank' | 'authorTotal'>): string {
  if (pub.rank == null) return ''
  if (pub.authorTotal == null) return String(pub.rank)
  return `${pub.rank}/${pub.authorTotal}`
}

export function defaultFirstAuthorRank(pub: Pick<Publication, 'isFirstAuthor' | 'coFirst' | 'firstAuthorRank'>): string {
  if (pub.firstAuthorRank?.trim()) return pub.firstAuthorRank.trim()
  if (!pub.isFirstAuthor) return ''
  return pub.coFirst ? '1/2' : '1/1'
}

export function paperViewUrl(
  pub: Pick<Publication, 'online' | 'pubmed'>,
  kind: 'full' | 'first',
): string {
  if (kind === 'full') return (pub.online || pub.pubmed || '').trim()
  return (pub.pubmed || pub.online || '').trim()
}

export function splitPubmedAndOnline(pubmed: string, online: string): { pubmed: string; online: string } {
  const p = (pubmed || '').trim()
  const o = (online || '').trim()
  if (o) return { pubmed: p.includes('pubmed') ? p : p.includes('doi.org') ? '' : p, online: o || (p.includes('doi.org') ? p : '') }
  if (/pubmed\.ncbi\.nlm\.nih\.gov/i.test(p)) return { pubmed: p, online: '' }
  if (/doi\.org/i.test(p)) return { pubmed: '', online: p }
  return { pubmed: p, online: '' }
}

export function createEmptyPublication(): Publication {
  const id = `pub_${Date.now().toString(36)}`
  const base: Publication = {
    id,
    date: '',
    year: '',
    title: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    impactFactor: '',
    cas: '',
    indexing: '',
    firstAuthor: '',
    authors: '',
    isFirstAuthor: false,
    coFirst: false,
    firstAuthorRank: '',
    isCorresponding: false,
    correspondingAuthor: '',
    rank: null,
    authorTotal: null,
    myContribution: '',
    citations: '',
    pubmed: '',
    online: '',
    pdfFull: '',
    pdfFirst: '',
    ris: '',
  }
  const paths = buildPdfPaths(base)
  return { ...base, ...paths, ris: generateRis(base) }
}

export function syncDerivedFields(pub: Publication): Publication {
  const year = pub.year || (pub.date.match(/(\d{4})/)?.[1] ?? '')
  const links = splitPubmedAndOnline(pub.pubmed, pub.online)
  let correspondingAuthor = pub.correspondingAuthor.trim()
  if (!correspondingAuthor || /[;；,]/.test(correspondingAuthor)) {
    correspondingAuthor = lastAuthor(pub.authors) || correspondingAuthor.split(/[;；,]/).pop()?.trim() || correspondingAuthor
  }
  const withYear = {
    ...pub,
    year,
    ...links,
    correspondingAuthor,
    firstAuthorRank: defaultFirstAuthorRank(pub),
  }
  const paths = buildPdfPaths(withYear)
  const next = {
    ...withYear,
    pdfFull: pub.pdfFull || paths.pdfFull,
    pdfFirst: pub.pdfFirst || paths.pdfFirst,
  }
  return { ...next, ris: pub.ris?.trim() ? pub.ris : generateRis(next) }
}

export function dateSortKey(date: string, year: string): string {
  const m = date?.match(/(\d{4})\D+(\d{1,2})/)
  if (m) return `${m[1]}${m[2].padStart(2, '0')}`
  if (year) return `${year}00`
  return '000000'
}
