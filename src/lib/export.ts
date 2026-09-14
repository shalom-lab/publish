import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { GithubSettings, Publication } from '../types'
import { COLUMNS } from './columns'
import { fetchPdfFromRepo } from './github'
import { rankDisplay } from './publication'

export function exportExcel(publications: Publication[], filename = 'publications.xlsx'): void {
  const rows = publications.map((p) => {
    const row: Record<string, string | number | boolean> = {}
    for (const col of COLUMNS) {
      if (col.key === 'ris' || col.key === 'id') continue
      const v = p[col.key]
      if (col.key === 'coFirst' || col.key === 'isFirstAuthor' || col.key === 'isCorresponding') {
        row[col.label] = v ? '是' : '否'
      } else if (col.key === 'rank') {
        row[col.label] = rankDisplay(p)
      }
      else if (v === null || v === undefined) row[col.label] = ''
      else row[col.label] = v as string | number
    }
    return row
  })
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Publications')
  const buf = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), filename)
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cellForCsv(pub: Publication, key: (typeof COLUMNS)[number]['key']): string {
  const v = pub[key]
  if (key === 'coFirst' || key === 'isFirstAuthor' || key === 'isCorresponding') return v ? '是' : '否'
  if (key === 'rank') return rankDisplay(pub)
  if (v === null || v === undefined) return ''
  return String(v)
}

/** 标准 CSV：逗号分隔、必要时双引号转义，首行为表头。不含 RIS。 */
export function publicationsToCsv(publications: Publication[]): string {
  const cols = COLUMNS.filter((c) => c.key !== 'ris' && c.key !== 'id')
  const header = cols.map((c) => csvEscape(c.label)).join(',')
  const lines = publications.map((p) => cols.map((c) => csvEscape(cellForCsv(p, c.key))).join(','))
  return [header, ...lines].join('\r\n')
}

export async function downloadPdfZip(
  publications: Publication[],
  kind: 'full' | 'first',
  zipName: string,
  settings: GithubSettings,
): Promise<{ ok: number; missing: number }> {
  const zip = new JSZip()
  let ok = 0
  let missing = 0
  for (const p of publications) {
    const path = kind === 'full' ? p.pdfFull : p.pdfFirst
    if (!path) {
      missing++
      continue
    }
    const blob = await fetchPdfFromRepo(settings, path)
    if (!blob) {
      missing++
      continue
    }
    const name = path.split('/').pop() || path
    zip.file(name, blob)
    ok++
  }
  if (ok === 0) {
    throw new Error('仓库里没有可打包的 PDF。请把文件放到 public/paper/ 或 paper/ 后推送到 GitHub')
  }
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, zipName)
  return { ok, missing }
}

export function downloadRis(pub: Publication): void {
  const blob = new Blob([pub.ris || ''], { type: 'application/x-research-info-systems;charset=utf-8' })
  const safe = (pub.title || pub.id || 'paper').slice(0, 40).replace(/[^\w\u4e00-\u9fff]+/g, '_')
  saveAs(blob, `${safe}.ris`)
}

export function downloadAllRis(publications: Publication[], filename = 'publications.ris'): void {
  const text = publications.map((p) => p.ris?.trim()).filter(Boolean).join('\r\n\r\n')
  const blob = new Blob([text + '\r\n'], { type: 'application/x-research-info-systems;charset=utf-8' })
  saveAs(blob, filename)
}
