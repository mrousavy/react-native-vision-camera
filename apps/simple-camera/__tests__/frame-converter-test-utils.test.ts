/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'
import type { Image } from 'react-native-nitro-image'
import type { CameraOrientation } from 'react-native-vision-camera'
import {
  compareImageToFrameLuma,
  createPresentedLumaGrid,
  type FrameLumaPlane,
  presentedToFrameCoordinate,
} from './frame-converter-test-utils'

type RawPixelData = ReturnType<Image['toRawPixelData']>

const paddedPlane: FrameLumaPlane = {
  pixels: new Uint8Array([1, 2, 3, 255, 255, 4, 5, 6, 255, 255, 7, 8, 9]),
  width: 3,
  height: 3,
  bytesPerRow: 5,
}

const presentationCases = [
  { orientation: 'up', mirrored: false, expected: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { orientation: 'up', mirrored: true, expected: [3, 2, 1, 6, 5, 4, 9, 8, 7] },
  {
    orientation: 'right',
    mirrored: false,
    expected: [7, 4, 1, 8, 5, 2, 9, 6, 3],
  },
  {
    orientation: 'right',
    mirrored: true,
    expected: [9, 6, 3, 8, 5, 2, 7, 4, 1],
  },
  {
    orientation: 'down',
    mirrored: false,
    expected: [9, 8, 7, 6, 5, 4, 3, 2, 1],
  },
  {
    orientation: 'down',
    mirrored: true,
    expected: [7, 8, 9, 4, 5, 6, 1, 2, 3],
  },
  {
    orientation: 'left',
    mirrored: false,
    expected: [3, 6, 9, 2, 5, 8, 1, 4, 7],
  },
  {
    orientation: 'left',
    mirrored: true,
    expected: [1, 4, 7, 2, 5, 8, 3, 6, 9],
  },
] satisfies {
  orientation: CameraOrientation
  mirrored: boolean
  expected: number[]
}[]

describe('Frame Converter luma reference', () => {
  for (const { orientation, mirrored, expected } of presentationCases) {
    it(`presents orientation=${orientation}, mirrored=${mirrored}`, () => {
      expect(
        createPresentedLumaGrid(paddedPlane, orientation, mirrored, 3),
      ).toEqual(expected)
    })
  }

  it('inverse-rotates before undoing the raw mirror', () => {
    const [frameX, frameY] = presentedToFrameCoordinate(0.2, 0.3, 'right', true)
    expect(frameX).toBeCloseTo(1 - 0.3)
    expect(frameY).toBeCloseTo(1 - 0.2)
  })

  it('ranks the intended layout ahead of every wrong layout', () => {
    const plane = createAsymmetricPlane(25)
    const intendedLumas = createPresentedLumaGrid(plane, 'right', true, 25)
    const intendedImage = createGrayscaleImage(intendedLumas, 25)

    const intended = compareImageToFrameLuma(
      plane,
      intendedImage,
      'right',
      true,
    )
    expect(intended.hasUsableSignal).toBe(true)
    expect(intended.intendedCorrelation).toBeCloseTo(1)
    expect(intended.strongestWrongCorrelation).toBeLessThan(0.95)

    const wrongLumas = createPresentedLumaGrid(plane, 'left', false, 25)
    const wrong = compareImageToFrameLuma(
      plane,
      createGrayscaleImage(wrongLumas, 25),
      'right',
      true,
    )
    expect(wrong.strongestWrongCorrelation).toBeCloseTo(1)
    expect(wrong.intendedCorrelation).toBeLessThan(
      wrong.strongestWrongCorrelation,
    )
  })

  it('rejects a spatially ambiguous Frame', () => {
    const pixels = new Uint8Array(25 * 25).fill(90)
    const plane = {
      pixels,
      width: 25,
      height: 25,
      bytesPerRow: 25,
    }
    const image = createGrayscaleImage([...pixels], 25)

    expect(
      compareImageToFrameLuma(plane, image, 'up', false).hasUsableSignal,
    ).toBe(false)
  })
})

function createAsymmetricPlane(size: number): FrameLumaPlane {
  const pixels = new Uint8Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pixels[y * size + x] = (x * 37 + y * 19 + x * y * 7) % 256
    }
  }
  return { pixels, width: size, height: size, bytesPerRow: size }
}

function createGrayscaleImage(lumas: number[], size: number): RawPixelData {
  const pixels = new Uint8Array(size * size * 4)
  for (let index = 0; index < lumas.length; index++) {
    const pixelOffset = index * 4
    const luma = lumas[index] ?? 0
    pixels[pixelOffset] = luma
    pixels[pixelOffset + 1] = luma
    pixels[pixelOffset + 2] = luma
    pixels[pixelOffset + 3] = 255
  }
  return {
    buffer: pixels.buffer,
    width: size,
    height: size,
    pixelFormat: 'RGBA',
  }
}
