import type { ColumnDef, PublicationKey } from '../types'
import { COLUMNS } from './columns'

export const COLUMN_PREFS_KEY = 'publish-column-prefs'

export interface ColumnPrefs {
  order: PublicationKey[]
  visible: PublicationKey[]
  /** Sticky data columns (left, after checkbox). Default: title. */
  pinned: PublicationKey[]
}

function isPublicationKey(key: string): key is PublicationKey {
  return COLUMNS.some((c) => c.key === key)
}

/** Merge saved order with current COLUMNS (append any new keys). */
export function resolveColumnOrder(saved?: PublicationKey[] | null): PublicationKey[] {
  const known = new Set(COLUMNS.map((c) => c.key))
  const ordered: PublicationKey[] = []
  for (const key of saved ?? []) {
    if (known.has(key) && !ordered.includes(key)) ordered.push(key)
  }
  for (const c of COLUMNS) {
    if (!ordered.includes(c.key)) ordered.push(c.key)
  }
  return ordered
}

export function defaultVisibleKeys(): PublicationKey[] {
  return COLUMNS.filter((c) => c.defaultVisible !== false).map((c) => c.key)
}

export function defaultPinnedKeys(): PublicationKey[] {
  return COLUMNS.some((c) => c.key === 'title') ? ['title'] : []
}

export function resolvePinnedKeys(saved?: PublicationKey[] | null): PublicationKey[] {
  const known = new Set(COLUMNS.map((c) => c.key))
  if (!saved) return defaultPinnedKeys()
  const pinned: PublicationKey[] = []
  for (const key of saved) {
    if (known.has(key) && !pinned.includes(key)) pinned.push(key)
  }
  return pinned
}

export function columnsInOrder(order: PublicationKey[]): ColumnDef[] {
  const map = new Map(COLUMNS.map((c) => [c.key, c]))
  return order.map((key) => map.get(key)).filter((c): c is ColumnDef => Boolean(c))
}

/** Visible columns split into sticky-left (pinned) and scrollable. */
export function splitVisibleColumns(
  columns: ColumnDef[],
  visible: Set<PublicationKey>,
  pinned: PublicationKey[],
): { pinnedCols: ColumnDef[]; scrollCols: ColumnDef[] } {
  const cols = columns.filter((c) => visible.has(c.key))
  const pinSet = new Set(pinned)
  const pinnedCols = cols.filter((c) => pinSet.has(c.key))
  const scrollCols = cols.filter((c) => !pinSet.has(c.key))
  return { pinnedCols, scrollCols }
}

export function loadColumnPrefs(): ColumnPrefs {
  try {
    const raw = localStorage.getItem(COLUMN_PREFS_KEY)
    if (!raw) {
      return {
        order: resolveColumnOrder(),
        visible: defaultVisibleKeys(),
        pinned: defaultPinnedKeys(),
      }
    }
    const parsed = JSON.parse(raw) as Partial<ColumnPrefs>
    const order = resolveColumnOrder(
      Array.isArray(parsed.order) ? parsed.order.filter(isPublicationKey) : null,
    )
    const visibleRaw = Array.isArray(parsed.visible)
      ? parsed.visible.filter(isPublicationKey)
      : defaultVisibleKeys()
    const known = new Set(order)
    const visible = visibleRaw.filter((k) => known.has(k))
    const pinned = resolvePinnedKeys(
      Array.isArray(parsed.pinned) ? parsed.pinned.filter(isPublicationKey) : undefined,
    ).filter((k) => known.has(k))
    return {
      order,
      visible: visible.length ? visible : defaultVisibleKeys(),
      pinned,
    }
  } catch {
    return {
      order: resolveColumnOrder(),
      visible: defaultVisibleKeys(),
      pinned: defaultPinnedKeys(),
    }
  }
}

export function saveColumnPrefs(prefs: ColumnPrefs): void {
  try {
    localStorage.setItem(
      COLUMN_PREFS_KEY,
      JSON.stringify({
        order: resolveColumnOrder(prefs.order),
        visible: prefs.visible.filter(isPublicationKey),
        pinned: resolvePinnedKeys(prefs.pinned),
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}
