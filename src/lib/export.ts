import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { Publication } from '../types'
import { COLUMNS } from './columns'
import { assetUrl } from './pdfName'

export function exportExcel(publications: Publication[], filename = 'publications.xlsx'): void {
  const rows = publications.map((p) => {
    const row: Record<string, string | number | boolean> = {}
    for (const col of COLUMNS) {
      const v = p[col.key]
      if (col.key === 'coFirst') row[col.label] = v ? '是' : '否'
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

async function fetchPdfBlob(relativePath: string): Promise<Blob | null> {
  if (!relativePath) return null
  try {
    const res = await fetch(assetUrl(relativePath))
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

export async function downloadPdfZip(
  publications: Publication[],
  kind: 'full' | 'first',
  zipName: string,
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
    const blob = await fetchPdfBlob(path)
    if (!blob) {
      missing++
      continue
    }
    const name = path.split('/').pop() || path
    zip.file(name, blob)
    ok++
  }
  if (ok === 0) {
    throw new Error('没有找到可下载的 PDF 文件，请先将 PDF 放入 public/paper/ 并核对路径')
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
