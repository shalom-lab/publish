/**
 * ???? data/publications.json?
 * ??? Windows ????????????????? data/publications.json?
 * ?? UTF-8 ?????npx tsx scripts/generate-data.mts
 *
 * ?????? JSON ?????? pdf ??? RIS??????????
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { buildPdfPaths } from '../src/lib/pdfName.ts'
import { generateRis } from '../src/lib/ris.ts'
import type { Publication } from '../src/types.ts'

const path = 'data/publications.json'
const raw = JSON.parse(readFileSync(path, 'utf8')) as Publication[]

const pubs = raw.map((p) => {
  const date = (p.date || '').replace(/^(\d{4})\/(\d{1,2})$/, (_m, y, m) => `${y}-${String(m).padStart(2, '0')}`)
  const next: Publication = {
    ...p,
    date,
    isFirstAuthor: p.isFirstAuthor ?? p.rank === 1,
    isCorresponding: p.isCorresponding ?? false,
    ...buildPdfPaths({ ...p, date }),
    ris: '',
  }
  next.ris = generateRis(next)
  return next
})

writeFileSync(path, JSON.stringify(pubs, null, 2) + '\n', 'utf8')
console.log('Refreshed', pubs.length, 'records in', path)
