export function wilsonScore(up: number, down: number, z = 1.96) {
    const n = up + down
    if (n === 0) return 0
    const p = up / n
    const denom = 1 + (z ** 2) / n
    const num = p + (z ** 2) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z ** 2) / (4 * n)) / n)
    return num / denom
  }