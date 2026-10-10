import type { CSSProperties } from 'react'

type Rgb = readonly [number, number, number]

/** 按期刊 IF 常见区间分段（参考热力胶囊：灰→绿→黄→橙→红）。 */
const STOPS: { at: number; ink: Rgb; bg: Rgb; border: Rgb }[] = [
  { at: 0, ink: [120, 128, 132], bg: [240, 242, 243], border: [196, 202, 206] },
  { at: 3, ink: [56, 128, 88], bg: [232, 244, 236], border: [140, 188, 156] },
  { at: 5, ink: [160, 120, 24], bg: [255, 246, 220], border: [220, 188, 96] },
  { at: 8, ink: [196, 100, 36], bg: [255, 236, 220], border: [232, 160, 104] },
  { at: 12, ink: [176, 48, 64], bg: [252, 228, 232], border: [220, 120, 132] },
  { at: 20, ink: [148, 28, 48], bg: [248, 210, 216], border: [200, 72, 92] },
]

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function rgb(c: Rgb): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(mix(a[0], b[0], t)),
    Math.round(mix(a[1], b[1], t)),
    Math.round(mix(a[2], b[2], t)),
  ]
}

function sampleAt(n: number): { ink: Rgb; bg: Rgb; border: Rgb } {
  if (n <= STOPS[0].at) return STOPS[0]
  const last = STOPS[STOPS.length - 1]
  if (n >= last.at) return last

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i]
    const b = STOPS[i + 1]
    if (n >= a.at && n <= b.at) {
      const t = clamp01((n - a.at) / (b.at - a.at))
      return {
        ink: lerpRgb(a.ink, b.ink, t),
        bg: lerpRgb(a.bg, b.bg, t),
        border: lerpRgb(a.border, b.border, t),
      }
    }
  }
  return last
}

/**
 * 当年 IF 胶囊：只显示数字；色阶参考热力胶囊，越高越红。
 */
export function impactFactorChipStyle(raw: string): CSSProperties | undefined {
  const n = parseFloat(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return undefined

  const { ink, bg, border } = sampleAt(n)
  return {
    background: rgb(bg),
    color: rgb(ink),
    border: `1px solid ${rgb(border)}`,
  }
}
