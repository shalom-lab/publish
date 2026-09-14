/**
 * Print expected PDF filenames for all publications (for renaming files into public/paper/).
 */
import { readFileSync } from 'node:fs'
import type { Publication } from '../src/types.ts'
import { buildPdfBasename } from '../src/lib/pdfName.ts'

const pubs = JSON.parse(readFileSync('public/data/publications.json', 'utf8')) as Publication[]

for (const p of pubs) {
  const base = buildPdfBasename(p)
  console.log(`\n[${p.id}] ${p.title.slice(0, 60)}...`)
  console.log(`  FULL : ${base}__full.pdf`)
  console.log(`  FIRST: ${base}__first.pdf`)
  console.log(`  json : ${p.pdfFull}`)
}
