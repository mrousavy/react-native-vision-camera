import { describe, expect, it } from 'react-native-harness'
import type { Image as NitroImage } from 'react-native-nitro-image'
import { Images } from 'react-native-nitro-image'
import type { CameraOrientation, Frame } from 'react-native-vision-camera'
import { HybridFrameConverter } from 'react-native-vision-camera'
import type { GPUFrame } from 'react-native-vision-camera-resizer'
import {
  createResizer,
  isResizerAvailable,
} from 'react-native-vision-camera-resizer'
import { withTimeout } from './test-utils'

type Rgb = [number, number, number]

const RED: Rgb = [255, 0, 0]
const GREEN: Rgb = [0, 255, 0]
const BLUE: Rgb = [0, 0, 255]
const YELLOW: Rgb = [255, 255, 0]

// Creates an Image where each pixel's color is computed from its coordinate.
function createImage(
  width: number,
  height: number,
  colorAt: (x: number, y: number) => Rgb,
): NitroImage {
  const buffer = new ArrayBuffer(width * height * 4)
  const view = new Uint8Array(buffer)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x, y)
      const i = (y * width + x) * 4
      view[i] = r
      view[i + 1] = g
      view[i + 2] = b
      view[i + 3] = 255
    }
  }
  return Images.loadFromRawPixelData({
    buffer: buffer,
    width: width,
    height: height,
    pixelFormat: 'RGBA',
  })
}

function createUprightFrame(
  width: number,
  height: number,
  colorAt: (x: number, y: number) => Rgb,
): Frame {
  const image = createImage(width, height, colorAt)
  try {
    return HybridFrameConverter.convertImageToFrame(image, 'up', false)
  } finally {
    image.dispose()
  }
}

// Reads the RGB value at the given pixel of an interleaved uint8 GPUFrame.
function readPixel(gpuFrame: GPUFrame, x: number, y: number): Rgb {
  const data = new Uint8Array(gpuFrame.getPixelBuffer())
  const i = (y * gpuFrame.width + x) * 3
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  if (r == null || g == null || b == null) {
    throw new Error(`no pixel data at ${x},${y}`)
  }
  return [r, g, b]
}

// Classifies a sampled color into one of the test colors, tolerating the
// small shifts introduced by the RGB -> YUV -> RGB conversion roundtrip.
function classifyColor([r, g, b]: Rgb): string {
  const isHigh = (value: number) => value > 155
  const isLow = (value: number) => value < 100
  if (isLow(r) && isLow(g) && isLow(b)) return 'black'
  if (isHigh(r) && isHigh(g) && isHigh(b)) return 'white'
  if (isHigh(r) && isHigh(g) && isLow(b)) return 'yellow'
  if (isHigh(r) && isLow(g) && isLow(b)) return 'red'
  if (isLow(r) && isHigh(g) && isLow(b)) return 'green'
  if (isLow(r) && isLow(g) && isHigh(b)) return 'blue'
  return `unknown(${r},${g},${b})`
}

function expectColorAt(
  gpuFrame: GPUFrame,
  x: number,
  y: number,
  expectedColor: string,
): void {
  expect(`${x},${y}: ${classifyColor(readPixel(gpuFrame, x, y))}`).toBe(
    `${x},${y}: ${expectedColor}`,
  )
}

const orientationCases: {
  orientation: CameraOrientation
  isMirrored: boolean
}[] = [
  { orientation: 'up', isMirrored: false },
  { orientation: 'up', isMirrored: true },
  { orientation: 'right', isMirrored: false },
  { orientation: 'right', isMirrored: true },
  { orientation: 'down', isMirrored: false },
  { orientation: 'down', isMirrored: true },
  { orientation: 'left', isMirrored: false },
  { orientation: 'left', isMirrored: true },
]

// A 96x48 image split into three equally-sized vertical stripes:
// red | green | blue
const stripeColorAt = (x: number, _y: number): Rgb => {
  if (x < 32) return RED
  if (x < 64) return GREEN
  return BLUE
}

describe('VisionCamera - Resizer', () => {
  it('reports GPU resizing availability', (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    expect(isResizerAvailable()).toBe(true)
  })

  it('undoes rotation and mirroring for every Frame orientation', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    // A 48x48 image with four colored quadrants:
    //  red  | green
    // ------+------
    //  blue | yellow
    const quadrantColorAt = (x: number, y: number): Rgb => {
      if (y < 24) return x < 24 ? RED : GREEN
      return x < 24 ? BLUE : YELLOW
    }
    const image = createImage(48, 48, quadrantColorAt)
    const resizer = await withTimeout(
      createResizer({
        width: 48,
        height: 48,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'cover',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      for (const { orientation, isMirrored } of orientationCases) {
        const frame = HybridFrameConverter.convertImageToFrame(
          image,
          orientation,
          isMirrored,
        )
        const resized = resizer.resize(frame)
        try {
          expect(resized.width).toBe(48)
          expect(resized.height).toBe(48)
          // The Resizer automatically counter-rotates and un-mirrors the
          // Frame - the output is always upright, no matter which
          // orientation the Frame was in.
          expectColorAt(resized, 12, 12, 'red')
          expectColorAt(resized, 36, 12, 'green')
          expectColorAt(resized, 12, 36, 'blue')
          expectColorAt(resized, 36, 36, 'yellow')
        } finally {
          resized.dispose()
          frame.dispose()
        }
      }
    } finally {
      resizer.dispose()
      image.dispose()
    }
  })

  it('center-crops the Frame with scaleMode=cover', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    const frame = createUprightFrame(96, 48, stripeColorAt)
    const resizer = await withTimeout(
      createResizer({
        width: 48,
        height: 48,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'cover',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      try {
        // The 96x48 input is cropped to its centered 48x48 region
        // (input x 24..72), so parts of all three stripes are visible:
        // red covers output x < 8, green x 8..40, blue x >= 40.
        expectColorAt(resized, 3, 24, 'red')
        expectColorAt(resized, 24, 24, 'green')
        expectColorAt(resized, 44, 24, 'blue')
      } finally {
        resized.dispose()
      }
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })

  it('letterboxes the Frame with scaleMode=contain', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    const frame = createUprightFrame(96, 48, stripeColorAt)
    const resizer = await withTimeout(
      createResizer({
        width: 48,
        height: 48,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'contain',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      try {
        // The 96x48 input is scaled by 0.5 to 48x24 and centered vertically
        // (output y 12..36) - the areas above and below are black bars.
        expectColorAt(resized, 24, 4, 'black')
        expectColorAt(resized, 24, 44, 'black')
        expectColorAt(resized, 8, 24, 'red')
        expectColorAt(resized, 24, 24, 'green')
        expectColorAt(resized, 40, 24, 'blue')
      } finally {
        resized.dispose()
      }
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })

  it('stretches the Frame with scaleMode=stretch', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    const frame = createUprightFrame(96, 48, stripeColorAt)
    const resizer = await withTimeout(
      createResizer({
        width: 48,
        height: 48,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'stretch',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      try {
        // The input is squashed horizontally to exactly fill the output -
        // all three stripes are fully visible, and there are no black bars.
        expectColorAt(resized, 8, 24, 'red')
        expectColorAt(resized, 24, 24, 'green')
        expectColorAt(resized, 40, 24, 'blue')
        expectColorAt(resized, 24, 4, 'green')
        expectColorAt(resized, 24, 44, 'green')
      } finally {
        resized.dispose()
      }
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })

  it('writes pixels in bgr channel order', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    const frame = createUprightFrame(32, 32, () => RED)
    const resizer = await withTimeout(
      createResizer({
        width: 16,
        height: 16,
        channelOrder: 'bgr',
        dataType: 'uint8',
        scaleMode: 'cover',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      try {
        expect(resized.channelOrder).toBe('bgr')
        const data = new Uint8Array(resized.getPixelBuffer())
        expect(data.byteLength).toBe(16 * 16 * 3)
        const i = (8 * 16 + 8) * 3
        // bgr: blue channel first, red channel last.
        expect(data[i]).toBeLessThan(60)
        expect(data[i + 1]).toBeLessThan(60)
        expect(data[i + 2]).toBeGreaterThan(195)
      } finally {
        resized.dispose()
      }
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })

  const dataTypeCases = [
    { dataType: 'uint8', bytesPerChannel: 1 },
    { dataType: 'int8', bytesPerChannel: 1 },
    { dataType: 'float16', bytesPerChannel: 2 },
    { dataType: 'float32', bytesPerChannel: 4 },
  ] as const
  for (const { dataType, bytesPerChannel } of dataTypeCases) {
    it(`outputs ${dataType} pixel data`, async (context) => {
      if (!isResizerAvailable()) {
        return context.skip(
          'resizer: GPU resizing is not available on this device',
        )
      }
      // A solid mid-gray image: every channel is ~128 (0.5 normalized).
      const frame = createUprightFrame(32, 32, () => [128, 128, 128])
      const resizer = await withTimeout(
        createResizer({
          width: 16,
          height: 16,
          channelOrder: 'rgb',
          dataType: dataType,
          scaleMode: 'cover',
          pixelLayout: 'interleaved',
        }),
        15_000,
        'create resizer',
      )
      try {
        const resized = resizer.resize(frame)
        try {
          expect(resized.dataType).toBe(dataType)
          const buffer = resized.getPixelBuffer()
          expect(buffer.byteLength).toBe(16 * 16 * 3 * bytesPerChannel)
          const i = (8 * 16 + 8) * 3
          switch (dataType) {
            case 'uint8': {
              const value = new Uint8Array(buffer)[i]
              if (value == null) throw new Error('no uint8 value')
              expect(Math.abs(value - 128)).toBeLessThanOrEqual(8)
              break
            }
            case 'int8': {
              // int8 values are shifted by -128: 128 maps to ~0.
              const value = new Int8Array(buffer)[i]
              if (value == null) throw new Error('no int8 value')
              expect(Math.abs(value)).toBeLessThanOrEqual(8)
              break
            }
            case 'float32': {
              // floats are normalized to 0.0...1.0: 128 maps to ~0.5.
              const value = new Float32Array(buffer)[i]
              if (value == null) throw new Error('no float32 value')
              expect(Math.abs(value - 0.5)).toBeLessThanOrEqual(0.05)
              break
            }
            case 'float16':
              // Hermes has no Float16Array - only the byteLength is verified.
              break
          }
        } finally {
          resized.dispose()
        }
      } finally {
        resizer.dispose()
        frame.dispose()
      }
    })
  }

  it('outputs planar pixel layout', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    // Left half red, right half blue.
    const frame = createUprightFrame(32, 32, (x) => (x < 16 ? RED : BLUE))
    const resizer = await withTimeout(
      createResizer({
        width: 16,
        height: 16,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'cover',
        pixelLayout: 'planar',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      try {
        expect(resized.pixelLayout).toBe('planar')
        const data = new Uint8Array(resized.getPixelBuffer())
        expect(data.byteLength).toBe(16 * 16 * 3)
        const planeSize = 16 * 16
        const leftIndex = 8 * 16 + 4
        const rightIndex = 8 * 16 + 12
        const readChannel = (plane: number, index: number): number => {
          const value = data[plane * planeSize + index]
          if (value == null) throw new Error('no planar value')
          return value
        }
        // R plane: high on the left, low on the right.
        expect(readChannel(0, leftIndex)).toBeGreaterThan(195)
        expect(readChannel(0, rightIndex)).toBeLessThan(60)
        // B plane: low on the left, high on the right.
        expect(readChannel(2, leftIndex)).toBeLessThan(60)
        expect(readChannel(2, rightIndex)).toBeGreaterThan(195)
      } finally {
        resized.dispose()
      }
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })

  it('only allows a single GPUFrame to be alive per Resizer', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    const frame = createUprightFrame(32, 32, () => GREEN)
    const resizer = await withTimeout(
      createResizer({
        width: 16,
        height: 16,
        channelOrder: 'rgb',
        dataType: 'uint8',
        scaleMode: 'cover',
        pixelLayout: 'interleaved',
      }),
      15_000,
      'create resizer',
    )
    try {
      const resized = resizer.resize(frame)
      // The Resizer reuses a single output buffer - resizing again while the
      // previous GPUFrame is still alive throws.
      expect(() => resizer.resize(frame)).toThrow()
      resized.dispose()
      // After disposing the GPUFrame, its properties are cleared...
      expect(resized.width).toBe(0)
      expect(resized.dataType).toBeUndefined()
      // ...and resizing works again.
      const secondResized = resizer.resize(frame)
      expect(secondResized.width).toBe(16)
      secondResized.dispose()
    } finally {
      resizer.dispose()
      frame.dispose()
    }
  })
})
