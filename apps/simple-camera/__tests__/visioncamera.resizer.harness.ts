import { afterAll, beforeAll, describe, expect, it } from 'react-native-harness'
import type { Image } from 'react-native-nitro-image'
import type {
  CameraDevice,
  CameraDeviceFactory,
  CameraOrientation,
  Frame,
  MirrorMode,
} from 'react-native-vision-camera'
import {
  CommonResolutions,
  HybridFrameConverter,
  VisionCamera,
} from 'react-native-vision-camera'
import type {
  GPUFrame,
  Resizer,
  ResizerOptions,
  ScaleMode,
} from 'react-native-vision-camera-resizer'
import {
  createResizer,
  isResizerAvailable,
} from 'react-native-vision-camera-resizer'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

const outputOrientations = [
  'up',
  'right',
  'down',
  'left',
] satisfies CameraOrientation[]
const mirrorModes = ['off', 'on'] satisfies MirrorMode[]
const scaleModes = ['cover', 'contain', 'stretch'] satisfies ScaleMode[]

// Odd dimensions exercise the final, partial Metal/Vulkan threadgroups.
const ORACLE_WIDTH = 47
const ORACLE_HEIGHT = 47
const FORMAT_WIDTH = 47
const FORMAT_HEIGHT = 31
const MAX_SPATIAL_FRAME_ATTEMPTS = 6

type RawPixelData = ReturnType<Image['toRawPixelData']>
type ImagePixelFormat = RawPixelData['pixelFormat']

describe('VisionCamera - Resizer', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice
  const observedOrientations = new Set<CameraOrientation>()
  const observedMirrorStates = new Set<boolean>()

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  afterAll(() => {
    if (!isResizerAvailable()) return
    expect([...observedOrientations].sort()).toEqual(
      [...outputOrientations].sort(),
    )
    expect([...observedMirrorStates].sort()).toEqual([false, true])
  })

  it('reports GPU resizing availability', (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }
    expect(isResizerAvailable()).toBe(true)
  })

  for (const outputOrientation of outputOrientations) {
    for (const mirrorMode of mirrorModes) {
      it(`matches upright Camera pixels for output=${outputOrientation}, mirror=${mirrorMode}`, async (context) => {
        if (!isResizerAvailable()) {
          return context.skip(
            'resizer: GPU resizing is not available on this device',
          )
        }

        const resizers = await createTestResizers(
          scaleModes.map((scaleMode) => ({
            width: ORACLE_WIDTH,
            height: ORACLE_HEIGHT,
            channelOrder: 'rgb',
            dataType: 'uint8',
            scaleMode,
            pixelLayout: 'interleaved',
          })),
        )

        try {
          const session = await VisionCamera.createCameraSession(false)
          const frameOutput = VisionCamera.createFrameOutput({
            targetResolution: CommonResolutions.VGA_4_3,
            pixelFormat: 'yuv',
            enablePreviewSizedOutputBuffers: false,
            enablePhysicalBufferRotation: false,
            enableCameraMatrixDelivery: false,
            allowDeferredStart: false,
            dropFramesWhileBusy: true,
          })
          frameOutput.outputOrientation = outputOrientation
          await session.configure([
            {
              input: backDevice,
              outputs: [{ output: frameOutput, mirrorMode }],
              constraints: [],
            },
          ])

          let receivedFrame = deferred<Frame>()
          const sessionFailed = deferred<never>()
          const errorSubscription = session.addOnErrorListener(
            sessionFailed.reject,
          )
          const runtime = workletsProvider.createRuntimeForThread(
            frameOutput.thread,
          )
          const didCapture = createSynchronizable(false)
          const framesSeen = createSynchronizable(0)
          let isWaitingForFrame = true
          const receiveFrame = (frame: Frame) => {
            if (isWaitingForFrame) {
              isWaitingForFrame = false
              receivedFrame.resolve(frame)
            } else {
              frame.dispose()
            }
          }
          const reportFrameError = (message: string) => {
            receivedFrame.reject(new Error(message))
          }
          runtime.setOnFrameCallback(frameOutput, (frame) => {
            'worklet'
            const frameNumber = framesSeen.getBlocking()
            framesSeen.setBlocking(frameNumber + 1)
            if (frameNumber < 2) {
              frame.dispose()
              return
            }
            if (didCapture.getBlocking()) {
              frame.dispose()
              return
            }
            didCapture.setBlocking(true)
            try {
              scheduleOnRN(receiveFrame, frame)
            } catch (error) {
              frame.dispose()
              scheduleOnRN(reportFrameError, String(error))
            }
          })

          let didStart = false
          let frame: Frame | undefined
          try {
            await session.start()
            didStart = true
            let uprightPixels: RawPixelData | undefined
            for (
              let attempt = 0;
              attempt < MAX_SPATIAL_FRAME_ATTEMPTS;
              attempt++
            ) {
              frame = await Promise.race([
                withTimeout(
                  receivedFrame.promise,
                  15_000,
                  `receive ${outputOrientation}/${mirrorMode} Camera Frame`,
                ),
                sessionFailed.promise,
              ])
              expect(frame.isMirrored).toBe(mirrorMode === 'on')
              observedOrientations.add(frame.orientation)
              observedMirrorStates.add(frame.isMirrored)
              if (!frame.hasNativeBuffer) {
                return context.skip(
                  'resizer: Camera Frame does not expose a native GPU buffer',
                )
              }

              const candidatePixels = convertFrameToUprightPixels(frame)
              const stretchReference = createReferencePixels(
                candidatePixels,
                ORACLE_WIDTH,
                ORACLE_HEIGHT,
                'stretch',
              )
              if (hasDistinctSpatialSignal(stretchReference)) {
                uprightPixels = candidatePixels
                break
              }

              frame.dispose()
              frame = undefined
              if (attempt + 1 < MAX_SPATIAL_FRAME_ATTEMPTS) {
                receivedFrame = deferred<Frame>()
                isWaitingForFrame = true
                didCapture.setBlocking(false)
              }
            }
            runtime.setOnFrameCallback(frameOutput, undefined)
            if (frame == null || uprightPixels == null) {
              return context.skip(
                `resizer pixels: ${MAX_SPATIAL_FRAME_ATTEMPTS} live Camera Frames could not distinguish rotations and mirroring`,
              )
            }

            for (let index = 0; index < scaleModes.length; index++) {
              const scaleMode = scaleModes[index]
              const resizer = resizers[index]
              if (scaleMode == null || resizer == null) {
                throw new Error(`missing scale-mode test case at ${index}`)
              }

              const referencePixels = createReferencePixels(
                uprightPixels,
                ORACLE_WIDTH,
                ORACLE_HEIGHT,
                scaleMode,
              )
              const resized = resizer.resize(frame)
              try {
                expect(resized.width).toBe(ORACLE_WIDTH)
                expect(resized.height).toBe(ORACLE_HEIGHT)
                expect(resized.channelOrder).toBe('rgb')
                expect(resized.dataType).toBe('uint8')
                expect(resized.pixelLayout).toBe('interleaved')

                const gpuPixels = copyUint8Pixels(resized)
                expectGpuPixelsToMatchReference(
                  gpuPixels,
                  referencePixels,
                  `${frame.orientation}/${frame.isMirrored}/${scaleMode}`,
                  scaleMode === 'stretch',
                )

                if (scaleMode === 'contain') {
                  expectContainBarsToBeBlack(
                    gpuPixels,
                    uprightPixels.width,
                    uprightPixels.height,
                  )
                }
              } finally {
                resized.dispose()
              }
            }

            console.log(
              `Resizer: target=${outputOrientation}, frame=${frame.orientation}, mirrored=${frame.isMirrored}`,
            )
          } finally {
            isWaitingForFrame = false
            runtime.setOnFrameCallback(frameOutput, undefined)
            frame?.dispose()
            errorSubscription.remove()
            if (didStart) {
              await session.stop()
            }
          }
        } finally {
          for (const resizer of resizers) {
            resizer.dispose()
          }
        }
      })
    }
  }

  it('writes equivalent formats from one real Camera Frame', async (context) => {
    if (!isResizerAvailable()) {
      return context.skip(
        'resizer: GPU resizing is not available on this device',
      )
    }

    const baseOptions = {
      width: FORMAT_WIDTH,
      height: FORMAT_HEIGHT,
      scaleMode: 'stretch',
    } as const
    const resizers = await createTestResizers([
      {
        ...baseOptions,
        channelOrder: 'rgb',
        dataType: 'uint8',
        pixelLayout: 'interleaved',
      },
      {
        ...baseOptions,
        channelOrder: 'bgr',
        dataType: 'uint8',
        pixelLayout: 'interleaved',
      },
      {
        ...baseOptions,
        channelOrder: 'rgb',
        dataType: 'uint8',
        pixelLayout: 'planar',
      },
      {
        ...baseOptions,
        channelOrder: 'rgb',
        dataType: 'int8',
        pixelLayout: 'interleaved',
      },
      {
        ...baseOptions,
        channelOrder: 'rgb',
        dataType: 'float16',
        pixelLayout: 'interleaved',
      },
      {
        ...baseOptions,
        channelOrder: 'rgb',
        dataType: 'float32',
        pixelLayout: 'interleaved',
      },
    ])
    const [
      rgbResizer,
      bgrResizer,
      planarResizer,
      int8Resizer,
      float16Resizer,
      float32Resizer,
    ] = resizers

    try {
      if (
        rgbResizer == null ||
        bgrResizer == null ||
        planarResizer == null ||
        int8Resizer == null ||
        float16Resizer == null ||
        float32Resizer == null
      ) {
        throw new Error('missing Resizer format test case')
      }

      const session = await VisionCamera.createCameraSession(false)
      const frameOutput = VisionCamera.createFrameOutput({
        targetResolution: CommonResolutions.VGA_4_3,
        pixelFormat: 'yuv',
        enablePreviewSizedOutputBuffers: false,
        enablePhysicalBufferRotation: false,
        enableCameraMatrixDelivery: false,
        allowDeferredStart: false,
        dropFramesWhileBusy: true,
      })
      frameOutput.outputOrientation = 'up'
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: frameOutput, mirrorMode: 'off' }],
          constraints: [],
        },
      ])

      const receivedFrame = deferred<Frame>()
      const sessionFailed = deferred<never>()
      const errorSubscription = session.addOnErrorListener(sessionFailed.reject)
      const runtime = workletsProvider.createRuntimeForThread(
        frameOutput.thread,
      )
      const didCapture = createSynchronizable(false)
      const framesSeen = createSynchronizable(0)
      let isWaitingForFrame = true
      const receiveFrame = (frame: Frame) => {
        if (isWaitingForFrame) {
          isWaitingForFrame = false
          receivedFrame.resolve(frame)
        } else {
          frame.dispose()
        }
      }
      const reportFrameError = (message: string) => {
        receivedFrame.reject(new Error(message))
      }
      runtime.setOnFrameCallback(frameOutput, (frame) => {
        'worklet'
        const frameNumber = framesSeen.getBlocking()
        framesSeen.setBlocking(frameNumber + 1)
        if (frameNumber < 2) {
          frame.dispose()
          return
        }
        if (didCapture.getBlocking()) {
          frame.dispose()
          return
        }
        didCapture.setBlocking(true)
        try {
          scheduleOnRN(receiveFrame, frame)
        } catch (error) {
          frame.dispose()
          scheduleOnRN(reportFrameError, String(error))
        }
      })

      let didStart = false
      let frame: Frame | undefined
      try {
        await session.start()
        didStart = true
        frame = await Promise.race([
          withTimeout(
            receivedFrame.promise,
            15_000,
            'receive Camera Frame for Resizer format tests',
          ),
          sessionFailed.promise,
        ])
        runtime.setOnFrameCallback(frameOutput, undefined)
        if (!frame.hasNativeBuffer) {
          return context.skip(
            'resizer: Camera Frame does not expose a native GPU buffer',
          )
        }
        const capturedFrame = frame

        const rgbFrame = rgbResizer.resize(capturedFrame)
        let rgbPixels: Uint8Array
        try {
          expect(() => rgbResizer.resize(capturedFrame)).toThrow()
          expectGpuFrameMetadata(rgbFrame, 'rgb', 'uint8', 'interleaved', 1)
          rgbPixels = copyUint8Pixels(rgbFrame)
        } finally {
          rgbFrame.dispose()
        }
        expect(() => rgbFrame.width).toThrow()
        expect(() => rgbFrame.getPixelBuffer()).toThrow()

        const reusableFrame = rgbResizer.resize(capturedFrame)
        try {
          expect(reusableFrame.width).toBe(FORMAT_WIDTH)
        } finally {
          reusableFrame.dispose()
        }

        const bgrPixels = resizeToUint8(
          bgrResizer,
          capturedFrame,
          'bgr',
          'interleaved',
        )
        const planarPixels = resizeToUint8(
          planarResizer,
          capturedFrame,
          'rgb',
          'planar',
        )
        const int8Pixels = resizeToInt8(int8Resizer, capturedFrame)
        const float16Pixels = resizeToFloat16(float16Resizer, capturedFrame)
        const float32Pixels = resizeToFloat32(float32Resizer, capturedFrame)

        const pixelCount = FORMAT_WIDTH * FORMAT_HEIGHT
        expect(rgbPixels.length).toBe(pixelCount * 3)
        expect(bgrPixels.length).toBe(pixelCount * 3)
        expect(planarPixels.length).toBe(pixelCount * 3)
        expect(int8Pixels.length).toBe(pixelCount * 3)
        expect(float16Pixels.length).toBe(pixelCount * 3)
        expect(float32Pixels.length).toBe(pixelCount * 3)

        for (let pixel = 0; pixel < pixelCount; pixel++) {
          for (let channel = 0; channel < 3; channel++) {
            const interleavedIndex = pixel * 3 + channel
            const planarIndex = channel * pixelCount + pixel
            const uint8Value = rgbPixels[interleavedIndex]
            const int8Value = int8Pixels[interleavedIndex]
            const float16Value = decodeFloat16(
              float16Pixels[interleavedIndex] ?? 0,
            )
            const float32Value = float32Pixels[interleavedIndex]
            if (
              uint8Value == null ||
              int8Value == null ||
              float32Value == null
            ) {
              throw new Error(`missing output channel at ${interleavedIndex}`)
            }

            expect(planarPixels[planarIndex]).toBe(uint8Value)
            expect(int8Value).toBe(uint8Value - 128)
            expect(
              Math.abs(float16Value - uint8Value / 255),
            ).toBeLessThanOrEqual(0.005)
            expect(
              Math.abs(float32Value - uint8Value / 255),
            ).toBeLessThanOrEqual(1 / 255)
          }

          const index = pixel * 3
          expect(bgrPixels[index]).toBe(rgbPixels[index + 2])
          expect(bgrPixels[index + 1]).toBe(rgbPixels[index + 1])
          expect(bgrPixels[index + 2]).toBe(rgbPixels[index])
        }
      } finally {
        isWaitingForFrame = false
        runtime.setOnFrameCallback(frameOutput, undefined)
        frame?.dispose()
        errorSubscription.remove()
        if (didStart) {
          await session.stop()
        }
      }
    } finally {
      for (const resizer of resizers) {
        resizer.dispose()
      }
    }
  })
})

async function createTestResizer(options: ResizerOptions): Promise<Resizer> {
  return await withTimeout(
    createResizer(options),
    15_000,
    `create ${options.scaleMode}/${options.dataType} Resizer`,
  )
}

async function createTestResizers(
  options: readonly ResizerOptions[],
): Promise<Resizer[]> {
  const resizers: Resizer[] = []
  try {
    for (const resizerOptions of options) {
      resizers.push(await createTestResizer(resizerOptions))
    }
    return resizers
  } catch (error) {
    for (const resizer of resizers) {
      resizer.dispose()
    }
    throw error
  }
}

function convertFrameToUprightPixels(frame: Frame): RawPixelData {
  const convertedImage = HybridFrameConverter.convertFrameToImage(frame)
  try {
    const uprightImage = convertedImage.resize(
      convertedImage.width,
      convertedImage.height,
    )
    try {
      return uprightImage.toRawPixelData()
    } finally {
      uprightImage.dispose()
    }
  } finally {
    convertedImage.dispose()
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

function copyUint8Pixels(frame: GPUFrame): Uint8Array {
  return new Uint8Array(frame.getPixelBuffer()).slice()
}

function resizeToUint8(
  resizer: Resizer,
  frame: Parameters<Resizer['resize']>[0],
  channelOrder: 'rgb' | 'bgr',
  pixelLayout: 'interleaved' | 'planar',
): Uint8Array {
  const resized = resizer.resize(frame)
  try {
    expectGpuFrameMetadata(resized, channelOrder, 'uint8', pixelLayout, 1)
    return copyUint8Pixels(resized)
  } finally {
    resized.dispose()
  }
}

function resizeToInt8(
  resizer: Resizer,
  frame: Parameters<Resizer['resize']>[0],
): Int8Array {
  const resized = resizer.resize(frame)
  try {
    expectGpuFrameMetadata(resized, 'rgb', 'int8', 'interleaved', 1)
    return new Int8Array(resized.getPixelBuffer()).slice()
  } finally {
    resized.dispose()
  }
}

function resizeToFloat16(
  resizer: Resizer,
  frame: Parameters<Resizer['resize']>[0],
): Uint16Array {
  const resized = resizer.resize(frame)
  try {
    expectGpuFrameMetadata(resized, 'rgb', 'float16', 'interleaved', 2)
    return new Uint16Array(resized.getPixelBuffer()).slice()
  } finally {
    resized.dispose()
  }
}

function resizeToFloat32(
  resizer: Resizer,
  frame: Parameters<Resizer['resize']>[0],
): Float32Array {
  const resized = resizer.resize(frame)
  try {
    expectGpuFrameMetadata(resized, 'rgb', 'float32', 'interleaved', 4)
    return new Float32Array(resized.getPixelBuffer()).slice()
  } finally {
    resized.dispose()
  }
}

function expectGpuFrameMetadata(
  frame: GPUFrame,
  channelOrder: 'rgb' | 'bgr',
  dataType: 'uint8' | 'int8' | 'float16' | 'float32',
  pixelLayout: 'interleaved' | 'planar',
  bytesPerChannel: number,
): void {
  expect(frame.width).toBe(FORMAT_WIDTH)
  expect(frame.height).toBe(FORMAT_HEIGHT)
  expect(frame.channelOrder).toBe(channelOrder)
  expect(frame.dataType).toBe(dataType)
  expect(frame.pixelLayout).toBe(pixelLayout)
  expect(frame.getPixelBuffer().byteLength).toBe(
    FORMAT_WIDTH * FORMAT_HEIGHT * 3 * bytesPerChannel,
  )
}

function expectGpuPixelsToMatchReference(
  gpuPixels: Uint8Array,
  referencePixels: Uint8Array,
  label: string,
  compareAlignment: boolean,
): void {
  expect(gpuPixels.byteLength).toBe(referencePixels.byteLength)
  const referenceLumas = toLumas(referencePixels)
  const gpuLumas = toLumas(gpuPixels)

  const meanRgbDifference = calculateMeanAbsoluteDifference(
    referencePixels,
    gpuPixels,
  )
  const meanLumaDifference = calculateMeanAbsoluteDifference(
    referenceLumas,
    gpuLumas,
  )
  expect(meanRgbDifference).toBeLessThanOrEqual(40)
  expect(meanLumaDifference).toBeLessThanOrEqual(28)

  const intendedCorrelation = calculateCorrelation(referenceLumas, gpuLumas)
  if (intendedCorrelation == null) {
    throw new Error(`${label}: reference pixels have no spatial signal`)
  }
  expect(intendedCorrelation).toBeGreaterThanOrEqual(0.65)

  if (compareAlignment) {
    const alternativeCorrelations = createSquareTransformAlternatives(
      referenceLumas,
    ).map((alternative) => calculateCorrelation(alternative, gpuLumas) ?? -1)
    const strongestWrongAlignment = Math.max(...alternativeCorrelations)
    expect(intendedCorrelation - strongestWrongAlignment).toBeGreaterThan(0.05)
  }
}

function hasDistinctSpatialSignal(pixels: Uint8Array): boolean {
  const lumas = toLumas(pixels)
  if (calculateVariance(lumas) < 1) {
    return false
  }
  const alternatives = createSquareTransformAlternatives(lumas)
  return alternatives.every((alternative) => {
    const correlation = calculateCorrelation(lumas, alternative)
    return correlation != null && correlation < 0.95
  })
}

function createSquareTransformAlternatives(values: number[]): number[][] {
  const rotated90 = rotateSquare(values)
  const rotated180 = rotateSquare(rotated90)
  const rotated270 = rotateSquare(rotated180)
  return [
    mirrorSquare(values),
    rotated90,
    rotated180,
    rotated270,
    mirrorSquare(rotated90),
    mirrorSquare(rotated180),
    mirrorSquare(rotated270),
  ]
}

function rotateSquare(values: number[]): number[] {
  const result = new Array<number>(values.length)
  for (let y = 0; y < ORACLE_HEIGHT; y++) {
    for (let x = 0; x < ORACLE_WIDTH; x++) {
      result[y * ORACLE_WIDTH + x] =
        values[(ORACLE_HEIGHT - 1 - x) * ORACLE_WIDTH + y] ?? 0
    }
  }
  return result
}

function mirrorSquare(values: number[]): number[] {
  const result = new Array<number>(values.length)
  for (let y = 0; y < ORACLE_HEIGHT; y++) {
    for (let x = 0; x < ORACLE_WIDTH; x++) {
      result[y * ORACLE_WIDTH + x] =
        values[y * ORACLE_WIDTH + (ORACLE_WIDTH - 1 - x)] ?? 0
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

function expectContainBarsToBeBlack(
  pixels: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
): void {
  const scale = Math.min(
    ORACLE_WIDTH / sourceWidth,
    ORACLE_HEIGHT / sourceHeight,
  )
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale
  const offsetX = (ORACLE_WIDTH - renderedWidth) / 2
  const offsetY = (ORACLE_HEIGHT - renderedHeight) / 2
  const outsidePixelIndices: number[] = []

  for (let y = 0; y < ORACLE_HEIGHT; y++) {
    for (let x = 0; x < ORACLE_WIDTH; x++) {
      const sourceX = (x + 0.5 - offsetX) / renderedWidth
      const sourceY = (y + 0.5 - offsetY) / renderedHeight
      if (sourceX < 0 || sourceX > 1 || sourceY < 0 || sourceY > 1) {
        outsidePixelIndices.push(y * ORACLE_WIDTH + x)
      }
    }
  }

  const sampleIndices = [
    outsidePixelIndices[0],
    outsidePixelIndices[Math.floor(outsidePixelIndices.length / 2)],
    outsidePixelIndices[outsidePixelIndices.length - 1],
  ]
  for (const pixelIndex of new Set(sampleIndices)) {
    if (pixelIndex == null) continue
    const index = pixelIndex * 3
    expect(pixels[index]).toBe(0)
    expect(pixels[index + 1]).toBe(0)
    expect(pixels[index + 2]).toBe(0)
  }
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
