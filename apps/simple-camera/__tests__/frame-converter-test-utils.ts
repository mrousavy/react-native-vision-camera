import type { Image } from 'react-native-nitro-image'
import type { CameraOrientation } from 'react-native-vision-camera'

export const FRAME_CONVERTER_ORIENTATIONS = [
  'up',
  'right',
  'down',
  'left',
] satisfies CameraOrientation[]

const DEFAULT_LUMA_GRID_SIZE = 25

type RawPixelData = ReturnType<Image['toRawPixelData']>
type ImagePixelFormat = RawPixelData['pixelFormat']

export interface FrameLumaPlane {
  pixels: Uint8Array
  width: number
  height: number
  bytesPerRow: number
}

export interface FrameLumaComparison {
  hasUsableSignal: boolean
  intendedCorrelation: number
  strongestWrongCorrelation: number
}

/**
 * Compares an upright Image against an independent presentation of the
 * Frame's Y plane using the Frame metadata's raw-mirror-then-rotate contract.
 */
export function compareImageToFrameLuma(
  plane: FrameLumaPlane,
  image: RawPixelData,
  orientation: CameraOrientation,
  isMirrored: boolean,
): FrameLumaComparison {
  const expectedLumas = createPresentedLumaGrid(plane, orientation, isMirrored)
  const wrongLumaLayouts = FRAME_CONVERTER_ORIENTATIONS.flatMap(
    (candidateOrientation) =>
      [false, true]
        .filter(
          (candidateMirror) =>
            candidateOrientation !== orientation ||
            candidateMirror !== isMirrored,
        )
        .map((candidateMirror) =>
          createPresentedLumaGrid(plane, candidateOrientation, candidateMirror),
        ),
  )

  const hasUsableSignal =
    calculateVariance(expectedLumas) >= 1 &&
    wrongLumaLayouts.every((wrongLumas) => {
      const correlation = calculateCorrelation(expectedLumas, wrongLumas)
      return correlation != null && correlation < 0.95
    })

  const imageLumas = sampleImageLumas(image, DEFAULT_LUMA_GRID_SIZE)
  const intendedCorrelation =
    calculateCorrelation(expectedLumas, imageLumas) ?? -1
  const strongestWrongCorrelation = Math.max(
    ...wrongLumaLayouts.map(
      (wrongLumas) => calculateCorrelation(wrongLumas, imageLumas) ?? -1,
    ),
  )

  return {
    hasUsableSignal,
    intendedCorrelation,
    strongestWrongCorrelation,
  }
}

/**
 * Samples the presented Y plane on a square grid. Presentation always rotates
 * the raw-X-mirrored Frame into its upright coordinate system.
 */
export function createPresentedLumaGrid(
  plane: FrameLumaPlane,
  orientation: CameraOrientation,
  isMirrored: boolean,
  gridSize = DEFAULT_LUMA_GRID_SIZE,
): number[] {
  validatePlane(plane)
  const lumas: number[] = []

  for (let outputY = 0; outputY < gridSize; outputY++) {
    for (let outputX = 0; outputX < gridSize; outputX++) {
      const presentedX = (outputX + 0.5) / gridSize
      const presentedY = (outputY + 0.5) / gridSize

      const [frameX, frameY] = presentedToFrameCoordinate(
        presentedX,
        presentedY,
        orientation,
        isMirrored,
      )
      const pixelX = Math.min(plane.width - 1, Math.floor(frameX * plane.width))
      const pixelY = Math.min(
        plane.height - 1,
        Math.floor(frameY * plane.height),
      )
      lumas.push(plane.pixels[pixelY * plane.bytesPerRow + pixelX] ?? 0)
    }
  }

  return lumas
}

function validatePlane(plane: FrameLumaPlane): void {
  if (plane.width <= 0 || plane.height <= 0) {
    throw new Error(`invalid Y plane size ${plane.width}x${plane.height}`)
  }
  if (plane.bytesPerRow < plane.width) {
    throw new Error(
      `Y plane row stride ${plane.bytesPerRow} is smaller than its visible width ${plane.width}`,
    )
  }

  const requiredBytes = (plane.height - 1) * plane.bytesPerRow + plane.width
  if (plane.pixels.byteLength < requiredBytes) {
    throw new Error(
      `Y plane had ${plane.pixels.byteLength} bytes, expected at least ${requiredBytes}`,
    )
  }
}

/**
 * Presentation applies a raw-X mirror and then rotation. The inverse mapping
 * therefore undoes rotation first, then flips the resulting raw X coordinate.
 */
export function presentedToFrameCoordinate(
  x: number,
  y: number,
  orientation: CameraOrientation,
  isMirrored: boolean,
): [number, number] {
  let frameCoordinate: [number, number]
  switch (orientation) {
    case 'up':
      frameCoordinate = [x, y]
      break
    case 'right':
      frameCoordinate = [y, 1 - x]
      break
    case 'down':
      frameCoordinate = [1 - x, 1 - y]
      break
    case 'left':
      frameCoordinate = [1 - y, x]
      break
  }
  if (isMirrored) {
    frameCoordinate[0] = 1 - frameCoordinate[0]
  }
  return frameCoordinate
}

function sampleImageLumas(image: RawPixelData, gridSize: number): number[] {
  const pixels = new Uint8Array(image.buffer)
  const layout = getRgbLayout(image.pixelFormat)
  const requiredBytes = image.width * image.height * layout.bytesPerPixel
  if (pixels.byteLength < requiredBytes) {
    throw new Error(
      `Image had ${pixels.byteLength} bytes, expected at least ${requiredBytes}`,
    )
  }

  const lumas: number[] = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const pixelX = Math.min(
        image.width - 1,
        Math.floor(((x + 0.5) / gridSize) * image.width),
      )
      const pixelY = Math.min(
        image.height - 1,
        Math.floor(((y + 0.5) / gridSize) * image.height),
      )
      const pixelOffset = (pixelY * image.width + pixelX) * layout.bytesPerPixel
      const red = pixels[pixelOffset + layout.red] ?? 0
      const green = pixels[pixelOffset + layout.green] ?? 0
      const blue = pixels[pixelOffset + layout.blue] ?? 0
      lumas.push(red * 0.299 + green * 0.587 + blue * 0.114)
    }
  }
  return lumas
}

function getRgbLayout(pixelFormat: ImagePixelFormat): {
  bytesPerPixel: number
  red: number
  green: number
  blue: number
} {
  switch (pixelFormat) {
    case 'RGBA':
    case 'RGBX':
      return { bytesPerPixel: 4, red: 0, green: 1, blue: 2 }
    case 'BGRA':
    case 'BGRX':
      return { bytesPerPixel: 4, red: 2, green: 1, blue: 0 }
    case 'ARGB':
    case 'XRGB':
      return { bytesPerPixel: 4, red: 1, green: 2, blue: 3 }
    case 'ABGR':
    case 'XBGR':
      return { bytesPerPixel: 4, red: 3, green: 2, blue: 1 }
    case 'RGB':
      return { bytesPerPixel: 3, red: 0, green: 1, blue: 2 }
    case 'BGR':
      return { bytesPerPixel: 3, red: 2, green: 1, blue: 0 }
    case 'unknown':
      throw new Error('Image returned an unknown raw pixel format')
  }
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return (
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  )
}

function calculateCorrelation(
  first: number[],
  second: number[],
): number | undefined {
  if (first.length !== second.length) {
    throw new Error(`cannot compare ${first.length} values to ${second.length}`)
  }

  const firstMean = first.reduce((sum, value) => sum + value, 0) / first.length
  const secondMean =
    second.reduce((sum, value) => sum + value, 0) / second.length
  let covariance = 0
  let firstVariance = 0
  let secondVariance = 0

  for (let index = 0; index < first.length; index++) {
    const firstDelta = (first[index] ?? 0) - firstMean
    const secondDelta = (second[index] ?? 0) - secondMean
    covariance += firstDelta * secondDelta
    firstVariance += firstDelta * firstDelta
    secondVariance += secondDelta * secondDelta
  }

  if (firstVariance === 0 || secondVariance === 0) {
    return undefined
  }
  return covariance / Math.sqrt(firstVariance * secondVariance)
}
