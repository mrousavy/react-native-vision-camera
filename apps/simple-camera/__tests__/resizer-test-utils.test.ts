/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'
import type { Image } from 'react-native-nitro-image'
import {
  analyzeReferenceSignal,
  compareFormats,
  comparePixels,
  compareRedBlueOrder,
  createScaleReferences,
  evaluatePixelComparison,
  getContainBarStats,
} from './resizer-test-utils'

type RawPixelData = ReturnType<Image['toRawPixelData']>

const OUTPUT_SIZE = 47

describe('Resizer pixel comparison', () => {
  it('accepts an asymmetric image and distinguishes every scale mode', () => {
    const references = createScaleReferences(
      createAsymmetricImage(12, 8),
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    const signal = analyzeReferenceSignal(references, OUTPUT_SIZE, OUTPUT_SIZE)
    expect(signal.isDistinct).toBe(true)

    for (const scaleMode of ['cover', 'contain', 'stretch'] as const) {
      const correct = comparePixels(
        references[scaleMode],
        references,
        scaleMode,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      )
      expect(correct.intendedCorrelation).toBeCloseTo(1)
      expect(correct.strongestWrongScaleCorrelation).toBeLessThan(0.98)
      expect(correct.strongestWrongTransformCorrelation).toBeLessThan(0.95)
      expect(evaluatePixelComparison(correct)).toEqual({
        failures: [],
        isAccepted: true,
      })
    }

    const stretchedInsteadOfCovered = comparePixels(
      references.stretch,
      references,
      'cover',
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )
    expect(stretchedInsteadOfCovered.strongestWrongScaleCorrelation).toBe(1)
    expect(stretchedInsteadOfCovered.intendedCorrelation).toBeLessThan(0.98)
    const wrongScaleAcceptance = evaluatePixelComparison(
      stretchedInsteadOfCovered,
    )
    expect(wrongScaleAcceptance.isAccepted).toBe(false)
    expect(
      wrongScaleAcceptance.failures.some((failure) =>
        failure.startsWith('scale-mode correlation margin'),
      ),
    ).toBe(true)
  })

  it('rejects spatial pixels that cannot distinguish scale modes', () => {
    const references = createScaleReferences(
      createSmoothGradientImage(12, 8),
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    const signal = analyzeReferenceSignal(references, OUTPUT_SIZE, OUTPUT_SIZE)
    expect(signal.isDistinct).toBe(false)
    expect(signal.minimumVariance).toBeGreaterThan(1)
    expect(signal.strongestWrongScaleCorrelation).toBeGreaterThan(0.98)
  })

  it('surfaces a systematic color cast even when geometry still correlates', () => {
    const references = createScaleReferences(
      createAsymmetricImage(12, 8),
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )
    expect(
      analyzeReferenceSignal(references, OUTPUT_SIZE, OUTPUT_SIZE).isDistinct,
    ).toBe(true)

    for (const scaleMode of ['cover', 'contain', 'stretch'] as const) {
      const tinted = references[scaleMode].slice()
      for (let index = 0; index < tinted.length; index += 3) {
        tinted[index] = Math.min(255, (tinted[index] ?? 0) + 39)
        tinted[index + 2] = Math.max(0, (tinted[index + 2] ?? 0) - 39)
      }

      const comparison = comparePixels(
        tinted,
        references,
        scaleMode,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      )
      expect(comparison.intendedCorrelation).toBeGreaterThan(0.9)
      const acceptance = evaluatePixelComparison(comparison)
      expect(acceptance.isAccepted).toBe(false)
      expect(acceptance.failures).toContain(
        'red absolute midtone bias 39.000 exceeds 32.000',
      )
      expect(acceptance.failures).toContain(
        'blue absolute midtone bias 39.000 exceeds 32.000',
      )
    }
  })

  it('rejects every wrong rotation and mirror for every scale mode', () => {
    const references = createScaleReferences(
      createAsymmetricImage(12, 8),
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    for (const scaleMode of ['cover', 'contain', 'stretch'] as const) {
      const wrongLayouts = createWrongD4Layouts(
        references[scaleMode],
        OUTPUT_SIZE,
      )
      for (const [layout, pixels] of wrongLayouts) {
        const comparison = comparePixels(
          pixels,
          references,
          scaleMode,
          OUTPUT_SIZE,
          OUTPUT_SIZE,
        )
        expect(
          comparison.strongestWrongTransformCorrelation,
          `${scaleMode}/${layout}`,
        ).toBeCloseTo(1)
        const acceptance = evaluatePixelComparison(comparison)
        expect(acceptance.isAccepted, `${scaleMode}/${layout}`).toBe(false)
        expect(
          acceptance.failures.some((failure) =>
            failure.startsWith('transform correlation margin'),
          ),
          `${scaleMode}/${layout}`,
        ).toBe(true)
      }
    }
  })

  it('finds every black contain pixel instead of sampling three of them', () => {
    const source = createAsymmetricImage(12, 8)
    const references = createScaleReferences(source, OUTPUT_SIZE, OUTPUT_SIZE)

    const bars = getContainBarStats(
      references.contain,
      source.width,
      source.height,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )
    expect(bars.pixelCount).toBeGreaterThan(0)
    expect(bars.maximumValue).toBe(0)

    const corrupted = references.contain.slice()
    corrupted[0] = 1
    expect(
      getContainBarStats(
        corrupted,
        source.width,
        source.height,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      ).maximumValue,
    ).toBe(1)
  })

  it('checks channel order, layout, and numeric representations in one pass', () => {
    const rgb = new Uint8Array([20, 80, 200, 255, 128, 0])
    const bgr = new Uint8Array([200, 80, 20, 0, 128, 255])
    const planar = new Uint8Array([20, 255, 80, 128, 200, 0])
    const int8 = new Int8Array([-108, -48, 72, 127, 0, -128])
    const float16 = Uint16Array.from(rgb, (value) => encodeFloat16(value / 255))
    const float32 = Float32Array.from(rgb, (value) => value / 255)

    const correct = compareFormats(rgb, bgr, planar, int8, float16, float32)
    expect(correct.firstExactMismatch).toBeUndefined()
    expect(correct.maximumFloat16Error).toBeLessThanOrEqual(0.0005)
    expect(correct.maximumFloat32Error).toBeLessThanOrEqual(1 / 255)

    const correctOrder = compareRedBlueOrder(rgb, rgb)
    expect(correctOrder.distinctPixelRatio).toBe(1)
    expect(correctOrder.intendedMeanDifference).toBe(0)
    expect(correctOrder.intendedMeanDifference).toBeLessThan(
      correctOrder.swappedMeanDifference,
    )
    const swappedOrder = compareRedBlueOrder(rgb, bgr)
    expect(swappedOrder.intendedMeanDifference).toBeGreaterThan(
      swappedOrder.swappedMeanDifference,
    )

    const corruptedBgr = bgr.slice()
    corruptedBgr[0] = 20
    expect(
      compareFormats(rgb, corruptedBgr, planar, int8, float16, float32)
        .firstExactMismatch,
    ).toBe('BGR channel order at pixel 0')

    const corruptedPlanar = planar.slice()
    corruptedPlanar[0] = 21
    expect(
      compareFormats(rgb, bgr, corruptedPlanar, int8, float16, float32)
        .firstExactMismatch,
    ).toBe('planar channel 0 at pixel 0')

    const corruptedInt8 = int8.slice()
    corruptedInt8[0] = -107
    expect(
      compareFormats(rgb, bgr, planar, corruptedInt8, float16, float32)
        .firstExactMismatch,
    ).toBe('int8 channel 0 at pixel 0')

    const corruptedFloat16 = float16.slice()
    corruptedFloat16[0] = encodeFloat16(1)
    expect(
      compareFormats(rgb, bgr, planar, int8, corruptedFloat16, float32)
        .maximumFloat16Error,
    ).toBeGreaterThan(0.5)

    const corruptedFloat32 = float32.slice()
    corruptedFloat32[0] = 1
    expect(
      compareFormats(rgb, bgr, planar, int8, float16, corruptedFloat32)
        .maximumFloat32Error,
    ).toBeGreaterThan(0.5)
  })
})

function createAsymmetricImage(width: number, height: number): RawPixelData {
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      pixels[index] = (x * 37 + y * 19 + x * y * 7) % 256
      pixels[index + 1] = (x * x * 17 + y * 31) % 256
      pixels[index + 2] = (x * 11 + y * y * 23) % 256
      pixels[index + 3] = 255
    }
  }
  return { buffer: pixels.buffer, width, height, pixelFormat: 'RGBA' }
}

function createSmoothGradientImage(
  width: number,
  height: number,
): RawPixelData {
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const value = 40 + x * 8 + y * 3
      pixels[index] = value
      pixels[index + 1] = value
      pixels[index + 2] = value
      pixels[index + 3] = 255
    }
  }
  return { buffer: pixels.buffer, width, height, pixelFormat: 'RGBA' }
}

function mirrorRgb(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const mirrored = new Uint8Array(pixels.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 3
      const destination = (y * width + (width - 1 - x)) * 3
      mirrored[destination] = pixels[source] ?? 0
      mirrored[destination + 1] = pixels[source + 1] ?? 0
      mirrored[destination + 2] = pixels[source + 2] ?? 0
    }
  }
  return mirrored
}

function rotateRgb(pixels: Uint8Array, size: number): Uint8Array {
  const rotated = new Uint8Array(pixels.length)
  for (let sourceY = 0; sourceY < size; sourceY++) {
    for (let sourceX = 0; sourceX < size; sourceX++) {
      const source = (sourceY * size + sourceX) * 3
      const destinationX = size - 1 - sourceY
      const destinationY = sourceX
      const destination = (destinationY * size + destinationX) * 3
      rotated[destination] = pixels[source] ?? 0
      rotated[destination + 1] = pixels[source + 1] ?? 0
      rotated[destination + 2] = pixels[source + 2] ?? 0
    }
  }
  return rotated
}

function createWrongD4Layouts(
  pixels: Uint8Array,
  size: number,
): [string, Uint8Array][] {
  const rotated90 = rotateRgb(pixels, size)
  const rotated180 = rotateRgb(rotated90, size)
  const rotated270 = rotateRgb(rotated180, size)
  return [
    ['mirror', mirrorRgb(pixels, size, size)],
    ['rotate-90', rotated90],
    ['rotate-180', rotated180],
    ['rotate-270', rotated270],
    ['mirror-rotate-90', mirrorRgb(rotated90, size, size)],
    ['mirror-rotate-180', mirrorRgb(rotated180, size, size)],
    ['mirror-rotate-270', mirrorRgb(rotated270, size, size)],
  ]
}

function encodeFloat16(value: number): number {
  const float32 = new Float32Array([value])
  const bits = new Uint32Array(float32.buffer)[0] ?? 0
  const sign = (bits >>> 16) & 0x8000
  const exponent = ((bits >>> 23) & 0xff) - 127 + 15
  const fraction = bits & 0x7fffff

  if (exponent <= 0) return sign
  if (exponent >= 0x1f) return sign | 0x7c00
  return sign | (exponent << 10) | (fraction >>> 13)
}
