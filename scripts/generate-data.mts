/**
 * Refresh data/publications.json derived fields:
 * last corresponding author, first-author rank, pubmed/online split.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { generateRis } from '../src/lib/ris.ts'
import {
  defaultFirstAuthorRank,
  lastAuthor,
  splitPubmedAndOnline,
} from '../src/lib/publication.ts'
import type { Publication } from '../src/types.ts'

const path = 'data/publications.json'
type Legacy = Publication & { totalAuthors?: number | null }
const raw = JSON.parse(readFileSync(path, 'utf8')) as Legacy[]

const onlineById: Record<string, string> = {
  pub_2023_vaccine_rsv: 'https://doi.org/10.1016/j.vaccine.2023.11.054',
  pub_2022_iorv_hosp: 'https://doi.org/10.1111/irv.12958',
  pub_2021_cjdc_rsv: 'https://doi.org/10.16462/j.cnki.zhjbkz.2021.11.018',
  pub_2022_pidj_rota: 'https://doi.org/10.1097/INF.0000000000003463',
  pub_2024_iorv_covid: 'https://doi.org/10.1111/irv.13291',
  pub_2025_geohealth: 'https://doi.org/10.1029/2025GH001353',
  pub_2022_shpm_review: 'https://doi.org/10.19428/j.cnki.sjpm.2022.21871',
  pub_gemini_protocol: 'https://doi.org/10.1136/bmjresp-2025-003850',
}

const pubs: Publication[] = raw.map((p) => {
  const authorTotal = p.authorTotal ?? p.totalAuthors ?? null
  const links = splitPubmedAndOnline(p.pubmed || '', p.online || onlineById[p.id] || '')
  const correspondingAuthor =
    lastAuthor(p.authors) || p.correspondingAuthor.split(/[;?,]/).pop()?.trim() || ''
  const next: Publication = {
    ...p,
    authorTotal,
    correspondingAuthor,
    isFirstAuthor: p.isFirstAuthor ?? p.rank === 1,
    coFirst: p.coFirst ?? false,
    isCorresponding: p.isCorresponding ?? false,
    firstAuthorRank: '',
    pubmed: links.pubmed,
    online: links.online || onlineById[p.id] || '',
  }
  delete (next as Legacy).totalAuthors
  next.firstAuthorRank = defaultFirstAuthorRank(next)
  next.ris = generateRis(next)
  return next
})

writeFileSync(path, JSON.stringify(pubs, null, 2) + '\n', 'utf8')
console.log('Refreshed', pubs.length)
for (const p of pubs) {
  console.log(p.id, p.correspondingAuthor, p.firstAuthorRank, p.rank + '/' + p.authorTotal, p.pubmed ? 'pm' : '-', p.online ? 'on' : '-')
}
