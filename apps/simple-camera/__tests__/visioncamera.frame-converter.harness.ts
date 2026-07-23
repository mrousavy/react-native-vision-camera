import { Platform } from 'react-native'
import { describe, expect, it } from 'react-native-harness'
import type { Image as NitroImage } from 'react-native-nitro-image'
import { Images } from 'react-native-nitro-image'
import type { CameraOrientation, Frame } from 'react-native-vision-camera'
import { HybridFrameConverter } from 'react-native-vision-camera'
import { withTimeout } from './test-utils'

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

const orientationDegrees: Record<CameraOrientation, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
}

// The test buffers below are always R,G,B,A byte order. react-native-nitro-image's
// Android `loadFromRawPixelData` currently R/B-swaps 4-byte formats (it packs
// ColorInt-ordered ints but raw-copies them into the RGBA-laid-out Bitmap memory) -
// its 'BGRA' fast path raw-copies bytes 1:1 instead, so labeling our R,G,B,A bytes
// as 'BGRA' on Android yields a byte-exact Bitmap. Remove once nitro-image is fixed.
const RAW_PIXEL_FORMAT = Platform.OS === 'android' ? 'BGRA' : 'RGBA'

// The test image is 32x48 with four luma quadrants:
//   30  | 90
//  -----+-----
//  150  | 210
const IMAGE_WIDTH = 32
const IMAGE_HEIGHT = 48
const QUADRANT_LUMAS = [
  [30, 90],
  [150, 210],
]

function createQuadrantImage(): NitroImage {
  const buffer = new ArrayBuffer(IMAGE_WIDTH * IMAGE_HEIGHT * 4)
  const view = new Uint8Array(buffer)
  for (let y = 0; y < IMAGE_HEIGHT; y++) {
    for (let x = 0; x < IMAGE_WIDTH; x++) {
      const quadrantRow = y < IMAGE_HEIGHT / 2 ? 0 : 1
      const quadrantColumn = x < IMAGE_WIDTH / 2 ? 0 : 1
      const luma = QUADRANT_LUMAS[quadrantRow]?.[quadrantColumn] ?? 0
      const i = (y * IMAGE_WIDTH + x) * 4
      view[i] = luma
      view[i + 1] = luma
      view[i + 2] = luma
      view[i + 3] = 255
    }
  }
  return Images.loadFromRawPixelData({
    buffer: buffer,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    pixelFormat: RAW_PIXEL_FORMAT,
  })
}

// Computes the expected physical buffer layout of a Frame created with the
// given orientation/isMirrored flags: the pixel data is rotated
// counter-clockwise by the orientation's degrees, then mirrored horizontally.
// (This is the inverse of the rotate-clockwise + mirror transform a consumer
// applies when interpreting the Frame's orientation/isMirrored flags.)
function expectedBufferLayout<T>(
  grid: T[][],
  orientation: CameraOrientation,
  isMirrored: boolean,
): T[][] {
  let result = grid
  const rotations = orientationDegrees[orientation] / 90
  for (let i = 0; i < rotations; i++) {
    result = rotateCounterClockwise(result)
  }
  if (isMirrored) {
    result = result.map((row) => [...row].reverse())
  }
  return result
}

function rotateCounterClockwise<T>(grid: T[][]): T[][] {
  const height = grid.length
  const width = grid[0]?.length ?? 0
  const result: T[][] = []
  for (let y = 0; y < width; y++) {
    const row: T[] = []
    for (let x = 0; x < height; x++) {
      const value = grid[x]?.[width - 1 - y]
      if (value == null)
        throw new Error(`grid value at ${x},${width - 1 - y} is null`)
      row.push(value)
    }
    result.push(row)
  }
  return result
}

// Reads the luma values at the four quadrant centers of an RGB Frame.
// The Frame's buffer is interleaved 4-byte RGB (BGRA on iOS, RGBA on
// Android) - for a grayscale pattern, the first channel is the luma
// either way.
function readLumaQuadrants(frame: Frame): number[][] {
  const width = frame.width
  const height = frame.height
  // Android RGBA Frames expose their (stride-sized) pixel data via a single
  // plane, iOS BGRA Frames are non-planar and expose it via getPixelBuffer().
  const planes = frame.getPlanes()
  const plane = planes[0]
  const bytesPerRow = plane?.bytesPerRow ?? frame.bytesPerRow
  const buffer = new Uint8Array(
    plane != null ? plane.getPixelBuffer() : frame.getPixelBuffer(),
  )
  const readAt = (x: number, y: number): number => {
    const value = buffer[y * bytesPerRow + x * 4]
    if (value == null) throw new Error(`no luma value at ${x},${y}`)
    return value
  }
  return [
    [readAt(width / 4, height / 4), readAt((width * 3) / 4, height / 4)],
    [
      readAt(width / 4, (height * 3) / 4),
      readAt((width * 3) / 4, (height * 3) / 4),
    ],
  ]
}

// The quadrant lumas are 60 apart, so even a generous tolerance still
// catches any rotation/mirroring mistake (which would be off by >= 60).
function expectLumasToMatch(
  actual: number[][],
  expected: number[][],
  tolerance = 10,
): void {
  for (let row = 0; row < expected.length; row++) {
    for (let column = 0; column < (expected[row]?.length ?? 0); column++) {
      const actualLuma = actual[row]?.[column]
      const expectedLuma = expected[row]?.[column]
      if (actualLuma == null || expectedLuma == null) {
        throw new Error(`missing luma value at ${row},${column}`)
      }
      expect(Math.abs(actualLuma - expectedLuma)).toBeLessThanOrEqual(tolerance)
    }
  }
}

describe('VisionCamera - Frame Converter', () => {
  it('creates a camera-like Frame from an Image', () => {
    const image = createQuadrantImage()
    try {
      const frame = HybridFrameConverter.convertImageToFrame(image, 'up', false)
      try {
        expect(frame.isValid).toBe(true)
        expect(frame.width).toBe(IMAGE_WIDTH)
        expect(frame.height).toBe(IMAGE_HEIGHT)
        expect(frame.orientation).toBe('up')
        expect(frame.isMirrored).toBe(false)
        expect(frame.timestamp).toBeGreaterThan(0)
        // Both platforms convert to a camera-like interleaved RGB format.
        expect(['rgb-bgra-8-bit', 'rgb-rgba-8-bit']).toContain(
          frame.pixelFormat,
        )
        expect(frame.isPlanar).toBe(false)
        expect(frame.hasPixelBuffer).toBe(true)

        // iOS BGRA Frames are non-planar (no planes), Android RGBA Frames
        // report a single interleaved plane. Check the planes before
        // getPixelBuffer() - some devices (e.g. emulators) do not allow
        // mapping the planes while the HardwareBuffer is CPU-locked.
        const planes = frame.getPlanes()
        expect(planes.length).toBeLessThanOrEqual(1)
        // The row stride may be padded beyond width * 4 bytes.
        expect(frame.bytesPerRow).toBeGreaterThanOrEqual(IMAGE_WIDTH * 4)
        expect(frame.getPixelBuffer().byteLength).toBeGreaterThan(0)
      } finally {
        frame.dispose()
      }
      // After dispose(), the Frame's native state is gone - any
      // property access throws.
      expect(() => frame.isValid).toThrow()
    } finally {
      image.dispose()
    }
  })

  for (const { orientation, isMirrored } of orientationCases) {
    it(`physically rotates the pixel data for orientation=${orientation} isMirrored=${isMirrored}`, () => {
      const image = createQuadrantImage()
      try {
        const frame = HybridFrameConverter.convertImageToFrame(
          image,
          orientation,
          isMirrored,
        )
        try {
          expect(frame.orientation).toBe(orientation)
          expect(frame.isMirrored).toBe(isMirrored)

          // left/right orientations physically rotate the buffer by 90°,
          // so the Frame's width/height are flipped.
          const isSideways = orientation === 'left' || orientation === 'right'
          expect(frame.width).toBe(isSideways ? IMAGE_HEIGHT : IMAGE_WIDTH)
          expect(frame.height).toBe(isSideways ? IMAGE_WIDTH : IMAGE_HEIGHT)

          const expected = expectedBufferLayout(
            QUADRANT_LUMAS,
            orientation,
            isMirrored,
          )
          const actual = readLumaQuadrants(frame)
          expectLumasToMatch(actual, expected)
        } finally {
          frame.dispose()
        }
      } finally {
        image.dispose()
      }
    })
  }

  for (const { orientation, isMirrored } of orientationCases) {
    it(`roundtrips an Image through a orientation=${orientation} isMirrored=${isMirrored} Frame and back`, () => {
      const image = createQuadrantImage()
      try {
        const frame = HybridFrameConverter.convertImageToFrame(
          image,
          orientation,
          isMirrored,
        )
        const roundtrippedImage =
          HybridFrameConverter.convertFrameToImage(frame)
        frame.dispose()
        try {
          // The roundtripped Image is upright again - its dimensions
          // match the original Image.
          expect(roundtrippedImage.width).toBe(IMAGE_WIDTH)
          expect(roundtrippedImage.height).toBe(IMAGE_HEIGHT)

          // Converting the roundtripped Image to an 'up' Frame physically
          // bakes any pending orientation metadata into pixels - its luma
          // quadrants must match the original upright pattern.
          const uprightFrame = HybridFrameConverter.convertImageToFrame(
            roundtrippedImage,
            'up',
            false,
          )
          try {
            const actual = readLumaQuadrants(uprightFrame)
            expectLumasToMatch(actual, QUADRANT_LUMAS)
          } finally {
            uprightFrame.dispose()
          }
        } finally {
          roundtrippedImage.dispose()
        }
      } finally {
        image.dispose()
      }
    })
  }

  // Guards against channel-order mixups (e.g. R/B swaps) - the grayscale
  // tests above are blind to those.
  it('preserves chroma through an Image -> Frame -> Image roundtrip', () => {
    const width = 32
    const height = 32
    const buffer = new ArrayBuffer(width * height * 4)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < width * height; i++) {
      // solid red
      view[i * 4] = 255
      view[i * 4 + 3] = 255
    }
    const image = Images.loadFromRawPixelData({
      buffer: buffer,
      width: width,
      height: height,
      pixelFormat: RAW_PIXEL_FORMAT,
    })
    try {
      const frame = HybridFrameConverter.convertImageToFrame(image, 'up', false)
      const roundtrippedImage = HybridFrameConverter.convertFrameToImage(frame)
      frame.dispose()
      try {
        const rawPixelData = roundtrippedImage.toRawPixelData()
        const pixels = new Uint8Array(rawPixelData.buffer)
        const pixelFormat = rawPixelData.pixelFormat
        const centerIndex = ((height / 2) * width + width / 2) * 4
        // [redOffset, blueOffset] within one 4-byte pixel, per format:
        const channelOffsets: Record<string, [number, number]> = {
          RGBA: [0, 2],
          RGBX: [0, 2],
          BGRA: [2, 0],
          BGRX: [2, 0],
          ARGB: [1, 3],
          XRGB: [1, 3],
          ABGR: [3, 1],
          XBGR: [3, 1],
        }
        // nitro-image labels Android's RGBA-laid-out Bitmap memory as 'BGRA'
        // (same ColorInt/byte-order confusion as above) - the raw bytes are
        // actually R,G,B,A. Remove once nitro-image is fixed.
        const offsets: [number, number] | undefined =
          Platform.OS === 'android' ? [0, 2] : channelOffsets[pixelFormat]
        if (offsets == null) {
          throw new Error(`Unexpected roundtripped pixelFormat: ${pixelFormat}`)
        }
        const red = pixels[centerIndex + offsets[0]]
        const blue = pixels[centerIndex + offsets[1]]
        if (red == null || blue == null) throw new Error('no pixel data')
        // red stays dominant, blue stays low - if the chroma planes were
        // swapped somewhere, this would be inverted.
        expect(red).toBeGreaterThan(195)
        expect(blue).toBeLessThan(60)
      } finally {
        roundtrippedImage.dispose()
      }
    } finally {
      image.dispose()
    }
  })

  it('converts an Image to a Frame asynchronously', async () => {
    const image = createQuadrantImage()
    try {
      const frame = await withTimeout(
        HybridFrameConverter.convertImageToFrameAsync(image, 'left', true),
        15_000,
        'convert Image to Frame asynchronously',
      )
      try {
        expect(frame.isValid).toBe(true)
        expect(frame.orientation).toBe('left')
        expect(frame.isMirrored).toBe(true)
        expect(frame.width).toBe(IMAGE_HEIGHT)
        expect(frame.height).toBe(IMAGE_WIDTH)

        const expected = expectedBufferLayout(QUADRANT_LUMAS, 'left', true)
        const actual = readLumaQuadrants(frame)
        expectLumasToMatch(actual, expected)
      } finally {
        frame.dispose()
      }
    } finally {
      image.dispose()
    }
  })
})
