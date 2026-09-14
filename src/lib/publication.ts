import type { Publication } from '../types'
import { buildPdfPaths } from './pdfName'
import { generateRis } from './ris'

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
    isCorresponding: false,
    correspondingAuthor: '',
    coFirst: false,
    rank: null,
    totalAuthors: null,
    myContribution: '',
    citations: '',
    pubmed: '',
    pdfFull: '',
    pdfFirst: '',
    ris: '',
  }
  const paths = buildPdfPaths(base)
  return { ...base, ...paths, ris: generateRis(base) }
}

export function syncDerivedFields(pub: Publication): Publication {
  const year = pub.year || (pub.date.match(/(\d{4})/)?.[1] ?? '')
  const withYear = { ...pub, year }
  const paths = buildPdfPaths(withYear)
  const next = {
    ...withYear,
    pdfFull: pub.pdfFull || paths.pdfFull,
    pdfFirst: pub.pdfFirst || paths.pdfFirst,
  }
  return { ...next, ris: pub.ris?.trim() ? pub.ris : generateRis(next) }
}

/** Parse date like 2023/11 or 2023-11 for sorting. */
export function dateSortKey(date: string, year: string): string {
  const m = date?.match(/(\d{4})\D+(\d{1,2})/)
  if (m) return `${m[1]}${m[2].padStart(2, '0')}`
  if (year) return `${year}00`
  return '000000'
}
