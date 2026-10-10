import type { CSSProperties } from 'react'

/** 低 IF：暖杏；高 IF：叶月红。按 1～15 线性映射到 0～1（可超出后封顶）。 */
const IF_MIN = 1
const IF_MAX = 15

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** 在两端 RGB 之间插值，输出 css rgb() */
function mixRgb(
  low: readonly [number, number, number],
  high: readonly [number, number, number],
  t: number,
): string {
  const r = Math.round(mix(low[0], high[0], t))
  const g = Math.round(mix(low[1], high[1], t))
  const b = Math.round(mix(low[2], high[2], t))
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * 当年 IF 胶囊样式：数值越高越偏叶月红。
 * 无有效数字时返回 undefined（调用方用默认 chip）。
 */
export function impactFactorChipStyle(raw: string): CSSProperties | undefined {
  const n = parseFloat(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return undefined

  const t = clamp01((n - IF_MIN) / (IF_MAX - IF_MIN))

  // 低：杏桃底/字/边；高：叶月红底 #fce8eb / 字 #9e2b3a / 边 #c04851
  return {
    background: mixRgb([255, 240, 230], [252, 232, 235], t),
    color: mixRgb([166, 92, 46], [158, 43, 58], t),
    border: `1px solid ${mixRgb([232, 180, 138], [192, 72, 81], t)}`,
  }
}
