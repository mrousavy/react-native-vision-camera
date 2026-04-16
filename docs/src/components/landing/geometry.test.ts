import { describe, expect, test } from 'bun:test'
import {
  getFrontLayerObjectPositionXPercent,
  isForegroundHit,
} from '@/components/landing/geometry'

describe('landing geometry', () => {
  test('keeps centered object position for invalid aspect ratios', () => {
    expect(getFrontLayerObjectPositionXPercent(null)).toBe(50)
    expect(getFrontLayerObjectPositionXPercent(Number.NaN)).toBe(50)
  })

  test('biases the front layer as the aspect ratio narrows', () => {
    const wide = getFrontLayerObjectPositionXPercent(2)
    const narrow = getFrontLayerObjectPositionXPercent(0.6)

    expect(wide).toBe(50)
    expect(narrow).toBeLessThan(wide)
  })

  test('detects foreground hits near the lower center of the frame', () => {
    expect(isForegroundHit(0.5, 0.9, 1000, 1000, { x: 0, y: 0 }, 50)).toBeTrue()
    expect(
      isForegroundHit(0.5, 0.2, 1000, 1000, { x: 0, y: 0 }, 50),
    ).toBeFalse()
  })
})
