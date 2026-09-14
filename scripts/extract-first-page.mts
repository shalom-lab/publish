/**
 * From each public/paper/*__full.pdf, write a 1-page *__first.pdf.
 * If full was corrupted to 1 page but first still has the complete doc, swap first.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'

const dir = 'public/paper'

async function pageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return doc.getPageCount()
}

async function extractFirstPage(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()
  const [page] = await out.copyPages(src, [0])
  out.addPage(page)
  return out.save()
}

const fulls = readdirSync(dir).filter((f) => f.endsWith('__full.pdf'))
for (const fullName of fulls) {
  const firstName = fullName.replace(/__full\.pdf$/i, '__first.pdf')
  const fullPath = join(dir, fullName)
  const firstPath = join(dir, firstName)

  let fullBytes = new Uint8Array(readFileSync(fullPath))
  let firstBytes = new Uint8Array(readFileSync(firstPath))
  const fullPages = await pageCount(fullBytes)
  const firstPages = await pageCount(firstBytes)

  if (fullPages === 1 && firstPages > 1) {
    writeFileSync(fullPath, firstBytes)
    fullBytes = firstBytes
    console.log('restored full from first:', fullName)
  }

  const extracted = await extractFirstPage(fullBytes)
  writeFileSync(firstPath, extracted)
  const restoredFullPages = await pageCount(new Uint8Array(readFileSync(fullPath)))
  console.log(
    `${fullName}: full=${restoredFullPages}p first=1p (${extracted.length} bytes)`,
  )
}
