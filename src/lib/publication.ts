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
    impactFactor: '',
    cas: '',
    indexing: '',
    firstAuthor: '',
    authors: '',
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
