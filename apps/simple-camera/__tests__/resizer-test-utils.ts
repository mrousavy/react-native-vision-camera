import type { Image } from 'react-native-nitro-image'
import type { ScaleMode } from 'react-native-vision-camera-resizer'

export const RESIZER_SCALE_MODES = [
  'cover',
  'contain',
  'stretch',
] as const satisfies readonly ScaleMode[]

const MINIMUM_LUMA_VARIANCE = 1
const MAXIMUM_WRONG_SCALE_CORRELATION = 0.98
const MAXIMUM_WRONG_TRANSFORM_CORRELATION = 0.95
const PIXEL_ACCEPTANCE = {
  maximumMeanRgbDifference: 36,
  maximumMeanLumaDifference: 28,
  maximumMeanChannelDifference: 36,
  maximumAbsoluteMeanChannelBias: 24,
  maximumMeanChannelBiasSpread: 32,
  minimumMidtoneChannelRatio: 0.01,
  maximumAbsoluteMidtoneChannelBias: 32,
  minimumIntendedCorrelation: 0.65,
  minimumTransformCorrelationMargin: 0.05,
  minimumScaleCorrelationMargin: 0.01,
} as const
const MIDTONE_MINIMUM = 40
const MIDTONE_MAXIMUM = 215

type RawPixelData = ReturnType<Image['toRawPixelData']>
type ImagePixelFormat = RawPixelData['pixelFormat']

export type ScaleReferences = Record<ScaleMode, Uint8Array>

export interface ReferenceSignal {
  isDistinct: boolean
  minimumMidtoneChannelRatio: number
  minimumVariance: number
  strongestWrongScaleCorrelation: number
  strongestWrongTransformCorrelation: number
}

export interface PixelComparison {
  intendedCorrelation: number | undefined
  meanChannelBiases: [number, number, number]
  meanChannelDifferences: [number, number, number]
  meanLumaDifference: number
  meanRgbDifference: number
  midtoneChannelBiases: [
    number | undefined,
    number | undefined,
    number | undefined,
  ]
  midtoneChannelRatios: [number, number, number]
  strongestWrongScaleCorrelation: number
  strongestWrongTransformCorrelation: number
}

export interface PixelAcceptance {
  failures: string[]
  isAccepted: boolean
}

export interface FormatComparison {
  firstExactMismatch: string | undefined
  maximumFloat16Error: number
  maximumFloat32Error: number
}

export interface RedBlueOrderComparison {
  distinctPixelRatio: number
  intendedMeanDifference: number
  swappedMeanDifference: number
}

export function createScaleReferences(
  source: RawPixelData,
  width: number,
  height: number,
): ScaleReferences {
  return {
    cover: createReferencePixels(source, width, height, 'cover'),
    contain: createReferencePixels(source, width, height, 'contain'),
    stretch: createReferencePixels(source, width, height, 'stretch'),
  }
}

export function analyzeReferenceSignal(
  references: ScaleReferences,
  width: number,
  height: number,
): ReferenceSignal {
  const lumas = RESIZER_SCALE_MODES.map((mode) => toLumas(references[mode]))
  const minimumVariance = Math.min(...lumas.map(calculateVariance))
  const minimumMidtoneChannelRatio = Math.min(
    ...RESIZER_SCALE_MODES.flatMap(
      (mode) =>
        calculateMidtoneChannelStats(references[mode], references[mode]).ratios,
    ),
  )

  let strongestWrongTransformCorrelation = -1
  for (const values of lumas) {
    for (const alternative of createTransformAlternatives(
      values,
      width,
      height,
    )) {
      strongestWrongTransformCorrelation = Math.max(
        strongestWrongTransformCorrelation,
        calculateCorrelation(values, alternative) ?? 1,
      )
    }
  }

  let strongestWrongScaleCorrelation = -1
  for (let first = 0; first < lumas.length; first++) {
    for (let second = first + 1; second < lumas.length; second++) {
      strongestWrongScaleCorrelation = Math.max(
        strongestWrongScaleCorrelation,
        calculateCorrelation(lumas[first] ?? [], lumas[second] ?? []) ?? 1,
      )
    }
  }

  return {
    isDistinct:
      minimumVariance >= MINIMUM_LUMA_VARIANCE &&
      minimumMidtoneChannelRatio >=
        PIXEL_ACCEPTANCE.minimumMidtoneChannelRatio &&
      strongestWrongTransformCorrelation <=
        MAXIMUM_WRONG_TRANSFORM_CORRELATION &&
      strongestWrongScaleCorrelation <= MAXIMUM_WRONG_SCALE_CORRELATION,
    minimumVariance,
    minimumMidtoneChannelRatio,
    strongestWrongScaleCorrelation,
    strongestWrongTransformCorrelation,
  }
}

export function comparePixels(
  gpuPixels: Uint8Array,
  references: ScaleReferences,
  scaleMode: ScaleMode,
  width: number,
  height: number,
): PixelComparison {
  const referencePixels = references[scaleMode]
  if (gpuPixels.byteLength !== referencePixels.byteLength) {
    throw new Error(
      `cannot compare ${gpuPixels.byteLength} GPU bytes to ${referencePixels.byteLength} reference bytes`,
    )
  }

  const referenceLumas = toLumas(referencePixels)
  const gpuLumas = toLumas(gpuPixels)
  const wrongTransformCorrelations = createTransformAlternatives(
    referenceLumas,
    width,
    height,
  ).map((alternative) => calculateCorrelation(alternative, gpuLumas) ?? -1)
  const wrongScaleCorrelations = RESIZER_SCALE_MODES.filter(
    (candidate) => candidate !== scaleMode,
  ).map(
    (candidate) =>
      calculateCorrelation(toLumas(references[candidate]), gpuLumas) ?? -1,
  )
  const midtoneChannels = calculateMidtoneChannelStats(
    referencePixels,
    gpuPixels,
  )

  return {
    intendedCorrelation: calculateCorrelation(referenceLumas, gpuLumas),
    meanChannelBiases: calculateMeanChannelBiases(referencePixels, gpuPixels),
    meanChannelDifferences: calculateMeanChannelDifferences(
      referencePixels,
      gpuPixels,
    ),
    meanLumaDifference: calculateMeanAbsoluteDifference(
      referenceLumas,
      gpuLumas,
    ),
    meanRgbDifference: calculateMeanAbsoluteDifference(
      referencePixels,
      gpuPixels,
    ),
    midtoneChannelBiases: midtoneChannels.biases,
    midtoneChannelRatios: midtoneChannels.ratios,
    strongestWrongScaleCorrelation: Math.max(...wrongScaleCorrelations),
    strongestWrongTransformCorrelation: Math.max(...wrongTransformCorrelations),
  }
}

export function evaluatePixelComparison(
  comparison: PixelComparison,
): PixelAcceptance {
  const failures: string[] = []

  addMaximumFailure(
    failures,
    'mean RGB difference',
    comparison.meanRgbDifference,
    PIXEL_ACCEPTANCE.maximumMeanRgbDifference,
  )
  addMaximumFailure(
    failures,
    'mean luma difference',
    comparison.meanLumaDifference,
    PIXEL_ACCEPTANCE.maximumMeanLumaDifference,
  )

  const channelNames = ['red', 'green', 'blue'] as const
  for (let channel = 0; channel < channelNames.length; channel++) {
    const name = channelNames[channel]
    addMaximumFailure(
      failures,
      `${name} mean difference`,
      comparison.meanChannelDifferences[channel] ?? Number.POSITIVE_INFINITY,
      PIXEL_ACCEPTANCE.maximumMeanChannelDifference,
    )
    addMaximumFailure(
      failures,
      `${name} absolute mean bias`,
      Math.abs(
        comparison.meanChannelBiases[channel] ?? Number.POSITIVE_INFINITY,
      ),
      PIXEL_ACCEPTANCE.maximumAbsoluteMeanChannelBias,
    )

    const midtoneRatio = comparison.midtoneChannelRatios[channel] ?? 0
    if (midtoneRatio < PIXEL_ACCEPTANCE.minimumMidtoneChannelRatio) {
      failures.push(
        `${name} midtone coverage ${formatMetric(midtoneRatio)} is below ${formatMetric(PIXEL_ACCEPTANCE.minimumMidtoneChannelRatio)}`,
      )
      continue
    }
    addMaximumFailure(
      failures,
      `${name} absolute midtone bias`,
      Math.abs(
        comparison.midtoneChannelBiases[channel] ?? Number.POSITIVE_INFINITY,
      ),
      PIXEL_ACCEPTANCE.maximumAbsoluteMidtoneChannelBias,
    )
  }

  const meanBiasSpread =
    Math.max(...comparison.meanChannelBiases) -
    Math.min(...comparison.meanChannelBiases)
  addMaximumFailure(
    failures,
    'mean channel-bias spread',
    meanBiasSpread,
    PIXEL_ACCEPTANCE.maximumMeanChannelBiasSpread,
  )

  const intendedCorrelation = comparison.intendedCorrelation
  if (intendedCorrelation == null) {
    failures.push('intended reference has no spatial correlation')
  } else {
    if (intendedCorrelation < PIXEL_ACCEPTANCE.minimumIntendedCorrelation) {
      failures.push(
        `intended correlation ${formatMetric(intendedCorrelation)} is below ${formatMetric(PIXEL_ACCEPTANCE.minimumIntendedCorrelation)}`,
      )
    }

    const transformMargin =
      intendedCorrelation - comparison.strongestWrongTransformCorrelation
    if (transformMargin <= PIXEL_ACCEPTANCE.minimumTransformCorrelationMargin) {
      failures.push(
        `transform correlation margin ${formatMetric(transformMargin)} is not above ${formatMetric(PIXEL_ACCEPTANCE.minimumTransformCorrelationMargin)}`,
      )
    }

    const scaleMargin =
      intendedCorrelation - comparison.strongestWrongScaleCorrelation
    if (scaleMargin <= PIXEL_ACCEPTANCE.minimumScaleCorrelationMargin) {
      failures.push(
        `scale-mode correlation margin ${formatMetric(scaleMargin)} is not above ${formatMetric(PIXEL_ACCEPTANCE.minimumScaleCorrelationMargin)}`,
      )
    }
  }

  return { failures, isAccepted: failures.length === 0 }
}

export function getContainBarStats(
  pixels: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  outputWidth: number,
  outputHeight: number,
): { maximumValue: number; pixelCount: number } {
  const scale = Math.min(outputWidth / sourceWidth, outputHeight / sourceHeight)
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale
  const offsetX = (outputWidth - renderedWidth) / 2
  const offsetY = (outputHeight - renderedHeight) / 2
  let maximumValue = 0
  let pixelCount = 0

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const sourceX = (x + 0.5 - offsetX) / renderedWidth
      const sourceY = (y + 0.5 - offsetY) / renderedHeight
      if (sourceX >= 0 && sourceX <= 1 && sourceY >= 0 && sourceY <= 1) {
        continue
      }

      pixelCount++
      const index = (y * outputWidth + x) * 3
      maximumValue = Math.max(
        maximumValue,
        pixels[index] ?? 0,
        pixels[index + 1] ?? 0,
        pixels[index + 2] ?? 0,
      )
    }
  }

  return { maximumValue, pixelCount }
}

/**
 * Uses pixels whose reference red/blue channels are visibly different to
 * determine whether an RGB result is closer to RGB or to a global R/B swap.
 */
export function compareRedBlueOrder(
  reference: Uint8Array,
  actual: Uint8Array,
): RedBlueOrderComparison {
  if (reference.length !== actual.length || reference.length % 3 !== 0) {
    throw new Error(
      `cannot compare ${reference.length} reference RGB bytes to ${actual.length} actual bytes`,
    )
  }

  const pixelCount = reference.length / 3
  let distinctPixels = 0
  let intendedDifference = 0
  let swappedDifference = 0

  for (let index = 0; index < reference.length; index += 3) {
    const referenceRed = reference[index] ?? 0
    const referenceBlue = reference[index + 2] ?? 0
    if (Math.abs(referenceRed - referenceBlue) < 8) continue

    const actualRed = actual[index] ?? 0
    const actualBlue = actual[index + 2] ?? 0
    distinctPixels++
    intendedDifference +=
      Math.abs(actualRed - referenceRed) + Math.abs(actualBlue - referenceBlue)
    swappedDifference +=
      Math.abs(actualRed - referenceBlue) + Math.abs(actualBlue - referenceRed)
  }

  const comparedChannels = distinctPixels * 2
  return {
    distinctPixelRatio: distinctPixels / pixelCount,
    intendedMeanDifference:
      comparedChannels === 0
        ? Number.POSITIVE_INFINITY
        : intendedDifference / comparedChannels,
    swappedMeanDifference:
      comparedChannels === 0
        ? Number.POSITIVE_INFINITY
        : swappedDifference / comparedChannels,
  }
}

export function compareFormats(
  rgbPixels: Uint8Array,
  bgrPixels: Uint8Array,
  planarPixels: Uint8Array,
  int8Pixels: Int8Array,
  float16Pixels: Uint16Array,
  float32Pixels: Float32Array,
): FormatComparison {
  const pixelCount = rgbPixels.length / 3
  let firstExactMismatch: string | undefined
  let maximumFloat16Error = 0
  let maximumFloat32Error = 0

  for (let pixel = 0; pixel < pixelCount; pixel++) {
    for (let channel = 0; channel < 3; channel++) {
      const interleavedIndex = pixel * 3 + channel
      const planarIndex = channel * pixelCount + pixel
      const uint8Value = rgbPixels[interleavedIndex] ?? 0
      const int8Value = int8Pixels[interleavedIndex]
      const float32Value = float32Pixels[interleavedIndex]

      if (
        firstExactMismatch == null &&
        planarPixels[planarIndex] !== uint8Value
      ) {
        firstExactMismatch = `planar channel ${channel} at pixel ${pixel}`
      }
      if (firstExactMismatch == null && int8Value !== uint8Value - 128) {
        firstExactMismatch = `int8 channel ${channel} at pixel ${pixel}`
      }
      maximumFloat16Error = Math.max(
        maximumFloat16Error,
        Math.abs(
          decodeFloat16(float16Pixels[interleavedIndex] ?? 0) -
            uint8Value / 255,
        ),
      )
      maximumFloat32Error = Math.max(
        maximumFloat32Error,
        Math.abs((float32Value ?? 0) - uint8Value / 255),
      )
    }

    const index = pixel * 3
    if (
      firstExactMismatch == null &&
      (bgrPixels[index] !== rgbPixels[index + 2] ||
        bgrPixels[index + 1] !== rgbPixels[index + 1] ||
        bgrPixels[index + 2] !== rgbPixels[index])
    ) {
      firstExactMismatch = `BGR channel order at pixel ${pixel}`
    }
  }

  return {
    firstExactMismatch,
    maximumFloat16Error,
    maximumFloat32Error,
  }
}

function createReferencePixels(
  source: RawPixelData,
  width: number,
  height: number,
  scaleMode: ScaleMode,
): Uint8Array {
  const result = new Uint8Array(width * height * 3)
  const sourcePixels = new Uint8Array(source.buffer)
  let renderedWidth = width
  let renderedHeight = height
  let offsetX = 0
  let offsetY = 0

  if (scaleMode !== 'stretch') {
    const scale =
      scaleMode === 'cover'
        ? Math.max(width / source.width, height / source.height)
        : Math.min(width / source.width, height / source.height)
    renderedWidth = source.width * scale
    renderedHeight = source.height * scale
    offsetX = (width - renderedWidth) / 2
    offsetY = (height - renderedHeight) / 2
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceX = (x + 0.5 - offsetX) / renderedWidth
      const sourceY = (y + 0.5 - offsetY) / renderedHeight
      if (
        scaleMode === 'contain' &&
        (sourceX < 0 || sourceX > 1 || sourceY < 0 || sourceY > 1)
      ) {
        continue
      }

      const [r, g, b] = sampleImageRgb(
        sourcePixels,
        source.pixelFormat,
        source.width,
        source.height,
        sourceX,
        sourceY,
      )
      const index = (y * width + x) * 3
      result[index] = Math.round(r)
      result[index + 1] = Math.round(g)
      result[index + 2] = Math.round(b)
    }
  }

  return result
}

function sampleImageRgb(
  pixels: Uint8Array,
  pixelFormat: ImagePixelFormat,
  width: number,
  height: number,
  normalizedX: number,
  normalizedY: number,
): [number, number, number] {
  const sourceX = normalizedX * width - 0.5
  const sourceY = normalizedY * height - 0.5
  const x0 = Math.floor(sourceX)
  const y0 = Math.floor(sourceY)
  const xWeight = sourceX - x0
  const yWeight = sourceY - y0

  const topLeft = readImageRgb(pixels, pixelFormat, width, height, x0, y0)
  const topRight = readImageRgb(pixels, pixelFormat, width, height, x0 + 1, y0)
  const bottomLeft = readImageRgb(
    pixels,
    pixelFormat,
    width,
    height,
    x0,
    y0 + 1,
  )
  const bottomRight = readImageRgb(
    pixels,
    pixelFormat,
    width,
    height,
    x0 + 1,
    y0 + 1,
  )

  return [0, 1, 2].map((channel) => {
    const top =
      (topLeft[channel] ?? 0) * (1 - xWeight) +
      (topRight[channel] ?? 0) * xWeight
    const bottom =
      (bottomLeft[channel] ?? 0) * (1 - xWeight) +
      (bottomRight[channel] ?? 0) * xWeight
    return top * (1 - yWeight) + bottom * yWeight
  }) as [number, number, number]
}

function readImageRgb(
  pixels: Uint8Array,
  pixelFormat: ImagePixelFormat,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number] {
  let stride: number
  let offsets: [number, number, number]
  switch (pixelFormat) {
    case 'RGBA':
    case 'RGBX':
      stride = 4
      offsets = [0, 1, 2]
      break
    case 'BGRA':
    case 'BGRX':
      stride = 4
      offsets = [2, 1, 0]
      break
    case 'ARGB':
    case 'XRGB':
      stride = 4
      offsets = [1, 2, 3]
      break
    case 'ABGR':
    case 'XBGR':
      stride = 4
      offsets = [3, 2, 1]
      break
    case 'RGB':
      stride = 3
      offsets = [0, 1, 2]
      break
    case 'BGR':
      stride = 3
      offsets = [2, 1, 0]
      break
    case 'unknown':
      throw new Error('Image returned an unknown raw pixel format')
  }

  const clampedX = Math.max(0, Math.min(width - 1, x))
  const clampedY = Math.max(0, Math.min(height - 1, y))
  const index = (clampedY * width + clampedX) * stride
  const r = pixels[index + offsets[0]]
  const g = pixels[index + offsets[1]]
  const b = pixels[index + offsets[2]]
  if (r == null || g == null || b == null) {
    throw new Error(`missing Image pixel ${clampedX},${clampedY}`)
  }
  return [r, g, b]
}

function createTransformAlternatives(
  values: number[],
  width: number,
  height: number,
): number[][] {
  if (width !== height) {
    throw new Error('rotation comparison requires a square output')
  }
  const rotated90 = rotateSquare(values, width)
  const rotated180 = rotateSquare(rotated90, width)
  const rotated270 = rotateSquare(rotated180, width)
  return [
    mirror(values, width, height),
    rotated90,
    rotated180,
    rotated270,
    mirror(rotated90, width, height),
    mirror(rotated180, width, height),
    mirror(rotated270, width, height),
  ]
}

function rotateSquare(values: number[], size: number): number[] {
  const result = new Array<number>(values.length)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      result[y * size + x] = values[(size - 1 - x) * size + y] ?? 0
    }
  }
  return result
}

function mirror(values: number[], width: number, height: number): number[] {
  const result = new Array<number>(values.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[y * width + x] = values[y * width + (width - 1 - x)] ?? 0
    }
  }
  return result
}

function toLumas(pixels: Uint8Array): number[] {
  const lumas: number[] = []
  for (let index = 0; index < pixels.length; index += 3) {
    lumas.push(
      toLuma(
        pixels[index] ?? 0,
        pixels[index + 1] ?? 0,
        pixels[index + 2] ?? 0,
      ),
    )
  }
  return lumas
}

function calculateMeanAbsoluteDifference(
  first: ArrayLike<number>,
  second: ArrayLike<number>,
): number {
  if (first.length !== second.length) {
    throw new Error(`cannot compare ${first.length} values to ${second.length}`)
  }
  let difference = 0
  for (let index = 0; index < first.length; index++) {
    difference += Math.abs((first[index] ?? 0) - (second[index] ?? 0))
  }
  return difference / first.length
}

function calculateMeanChannelDifferences(
  reference: Uint8Array,
  actual: Uint8Array,
): [number, number, number] {
  const differences: [number, number, number] = [0, 0, 0]
  const pixelCount = reference.length / 3
  for (let index = 0; index < reference.length; index++) {
    const channel = index % 3
    differences[channel] =
      (differences[channel] ?? 0) +
      Math.abs((reference[index] ?? 0) - (actual[index] ?? 0))
  }
  return differences.map((difference) => difference / pixelCount) as [
    number,
    number,
    number,
  ]
}

function calculateMeanChannelBiases(
  reference: Uint8Array,
  actual: Uint8Array,
): [number, number, number] {
  const biases: [number, number, number] = [0, 0, 0]
  const pixelCount = reference.length / 3
  for (let index = 0; index < reference.length; index++) {
    const channel = index % 3
    biases[channel] =
      (biases[channel] ?? 0) + (actual[index] ?? 0) - (reference[index] ?? 0)
  }
  return biases.map((bias) => bias / pixelCount) as [number, number, number]
}

function calculateMidtoneChannelStats(
  reference: Uint8Array,
  actual: Uint8Array,
): {
  biases: [number | undefined, number | undefined, number | undefined]
  ratios: [number, number, number]
} {
  const biasSums: [number, number, number] = [0, 0, 0]
  const counts: [number, number, number] = [0, 0, 0]
  const pixelCount = reference.length / 3

  for (let index = 0; index < reference.length; index++) {
    const referenceValue = reference[index] ?? 0
    if (referenceValue < MIDTONE_MINIMUM || referenceValue > MIDTONE_MAXIMUM) {
      continue
    }

    const channel = index % 3
    biasSums[channel] =
      (biasSums[channel] ?? 0) + (actual[index] ?? 0) - referenceValue
    counts[channel] = (counts[channel] ?? 0) + 1
  }

  return {
    biases: biasSums.map((sum, channel) => {
      const count = counts[channel] ?? 0
      return count === 0 ? undefined : sum / count
    }) as [number | undefined, number | undefined, number | undefined],
    ratios: counts.map((count) => count / pixelCount) as [
      number,
      number,
      number,
    ],
  }
}

function addMaximumFailure(
  failures: string[],
  label: string,
  value: number,
  maximum: number,
): void {
  if (value > maximum) {
    failures.push(
      `${label} ${formatMetric(value)} exceeds ${formatMetric(maximum)}`,
    )
  }
}

function formatMetric(value: number): string {
  return value.toFixed(3)
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

function toLuma(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114
}

function decodeFloat16(value: number): number {
  const sign = (value & 0x8000) === 0 ? 1 : -1
  const exponent = (value >> 10) & 0x1f
  const fraction = value & 0x03ff

  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024)
  }
  if (exponent === 0x1f) {
    return fraction === 0 ? sign * Number.POSITIVE_INFINITY : Number.NaN
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024)
}
