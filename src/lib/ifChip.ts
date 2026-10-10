import type { CSSProperties } from 'react'

/** 约 2～12：常见刊偏杏橙，≥10 才明显叶月红；更高封顶。 */
const IF_MIN = 2
const IF_MAX = 12
/** >1 让高分区更陡，低中档仍偏杏、不扎堆发粉。 */
const IF_GAMMA = 1.35

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

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
 * 当年 IF 胶囊：只显示数字；越高越叶月红，高低档色差拉开。
 */
export function impactFactorChipStyle(raw: string): CSSProperties | undefined {
  const n = parseFloat(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return undefined

  const linear = clamp01((n - IF_MIN) / (IF_MAX - IF_MIN))
  const t = clamp01(linear ** IF_GAMMA)

  // 低：浅杏底 + 棕字；高：饱和叶月红底 + 深红字（对比刻意加大）
  return {
    background: mixRgb([255, 244, 230], [242, 160, 170], t),
    color: mixRgb([154, 100, 48], [130, 22, 40], t),
    border: `1px solid ${mixRgb([232, 196, 154], [176, 48, 68], t)}`,
  }
}
