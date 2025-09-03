import { describe, expect, it } from 'vitest'
import { wilsonScore } from './ranking'

describe('wilsonScore', () => {
  it('returns 0 when there are no votes', () => {
    expect(wilsonScore(0, 0)).toBe(0)
  })

  it('increases with more positive votes', () => {
    expect(wilsonScore(10, 0)).toBeGreaterThan(wilsonScore(1, 0))
  })

  it('is lower when negative votes increase', () => {
    expect(wilsonScore(10, 5)).toBeLessThan(wilsonScore(10, 0))
  })

  it('matches known value', () => {
    expect(wilsonScore(100, 0)).toBeCloseTo(0.963005, 6)
  })
})

