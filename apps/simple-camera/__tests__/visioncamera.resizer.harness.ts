import { afterAll, beforeAll, describe, expect, it } from 'react-native-harness'
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
} from 'react-native-vision-camera-resizer'
import {
  createResizer,
  isResizerAvailable,
} from 'react-native-vision-camera-resizer'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import {
  analyzeReferenceSignal,
  compareFormats,
  comparePixels,
  compareRedBlueOrder,
  createScaleReferences,
  evaluatePixelComparison,
  getContainBarStats,
  RESIZER_SCALE_MODES,
  type ScaleReferences,
} from './resizer-test-utils'
import { deferred, withTimeout } from './test-utils'

const outputOrientations = [
  'up',
  'right',
  'down',
  'left',
] satisfies CameraOrientation[]
const mirrorModes = ['off', 'on'] satisfies MirrorMode[]

// Odd dimensions exercise the final, partial Metal/Vulkan threadgroups.
const REFERENCE_WIDTH = 47
const REFERENCE_HEIGHT = 47
const FORMAT_WIDTH = 47
const FORMAT_HEIGHT = 31
const MAX_FRAME_ATTEMPTS = 6
const MIN_DISTINCT_RED_BLUE_RATIO = 0.01

const expectedFrameConfigurations = outputOrientations.flatMap((orientation) =>
  [false, true].map((isMirrored) =>
    frameConfigurationKey(orientation, isMirrored),
  ),
)

describe('VisionCamera - Resizer', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice
  const validatedFrameConfigurations = new Set<string>()

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
    expect([...validatedFrameConfigurations].sort()).toEqual(
      [...expectedFrameConfigurations].sort(),
    )
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
          RESIZER_SCALE_MODES.map((scaleMode) => ({
            width: REFERENCE_WIDTH,
            height: REFERENCE_HEIGHT,
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
            let uprightPixels:
              | ReturnType<typeof rasterizePresentedFramePixels>
              | undefined
            let references: ScaleReferences | undefined
            let lastSignal:
              | ReturnType<typeof analyzeReferenceSignal>
              | undefined
            for (let attempt = 0; attempt < MAX_FRAME_ATTEMPTS; attempt++) {
              frame = await Promise.race([
                withTimeout(
                  receivedFrame.promise,
                  15_000,
                  `receive ${outputOrientation}/${mirrorMode} Camera Frame`,
                ),
                sessionFailed.promise,
              ])
              expect(frame.isMirrored).toBe(mirrorMode === 'on')
              if (!frame.hasNativeBuffer) {
                throw new Error(
                  'resizer: Camera Frame does not expose a native GPU buffer',
                )
              }

              const candidatePixels = rasterizePresentedFramePixels(frame)
              const candidateReferences = createScaleReferences(
                candidatePixels,
                REFERENCE_WIDTH,
                REFERENCE_HEIGHT,
              )
              lastSignal = analyzeReferenceSignal(
                candidateReferences,
                REFERENCE_WIDTH,
                REFERENCE_HEIGHT,
              )
              if (lastSignal.isDistinct) {
                uprightPixels = candidatePixels
                references = candidateReferences
                break
              }

              frame.dispose()
              frame = undefined
              if (attempt + 1 < MAX_FRAME_ATTEMPTS) {
                receivedFrame = deferred<Frame>()
                isWaitingForFrame = true
                didCapture.setBlocking(false)
              }
            }
            runtime.setOnFrameCallback(frameOutput, undefined)
            if (frame == null || uprightPixels == null || references == null) {
              throw new Error(
                `resizer pixels: ${MAX_FRAME_ATTEMPTS} real Camera Frames could not distinguish rotations, mirroring, scale modes, and color channels (variance=${lastSignal?.minimumVariance.toFixed(2)}, midtone-ratio=${lastSignal?.minimumMidtoneChannelRatio.toFixed(3)}, transform-correlation=${lastSignal?.strongestWrongTransformCorrelation.toFixed(3)}, scale-correlation=${lastSignal?.strongestWrongScaleCorrelation.toFixed(3)})`,
              )
            }

            for (let index = 0; index < RESIZER_SCALE_MODES.length; index++) {
              const scaleMode = RESIZER_SCALE_MODES[index]
              const resizer = resizers[index]
              if (scaleMode == null || resizer == null) {
                throw new Error(`missing scale-mode test case at ${index}`)
              }

              const resized = resizer.resize(frame)
              try {
                expect(resized.width).toBe(REFERENCE_WIDTH)
                expect(resized.height).toBe(REFERENCE_HEIGHT)
                expect(resized.channelOrder).toBe('rgb')
                expect(resized.dataType).toBe('uint8')
                expect(resized.pixelLayout).toBe('interleaved')

                const gpuPixels = copyUint8Pixels(resized)
                expectGpuPixelsToMatchScaleMode(
                  gpuPixels,
                  references,
                  `${frame.orientation}/${frame.isMirrored}/${scaleMode}`,
                  scaleMode,
                )

                if (scaleMode === 'contain') {
                  const bars = getContainBarStats(
                    gpuPixels,
                    uprightPixels.width,
                    uprightPixels.height,
                    REFERENCE_WIDTH,
                    REFERENCE_HEIGHT,
                  )
                  expect(bars.pixelCount).toBeGreaterThan(0)
                  expect(bars.maximumValue).toBe(0)
                }
              } finally {
                resized.dispose()
              }
            }

            validatedFrameConfigurations.add(
              frameConfigurationKey(frame.orientation, frame.isMirrored),
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

      let receivedFrame = deferred<Frame>()
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
      let rgbFrame: GPUFrame | undefined
      try {
        await session.start()
        didStart = true
        let rgbPixels: Uint8Array | undefined
        let redBlueOrder: ReturnType<typeof compareRedBlueOrder> | undefined
        for (let attempt = 0; attempt < MAX_FRAME_ATTEMPTS; attempt++) {
          frame = await Promise.race([
            withTimeout(
              receivedFrame.promise,
              15_000,
              'receive Camera Frame for Resizer format tests',
            ),
            sessionFailed.promise,
          ])
          if (!frame.hasNativeBuffer) {
            throw new Error(
              'resizer: Camera Frame does not expose a native GPU buffer',
            )
          }

          rgbFrame = rgbResizer.resize(frame)
          rgbPixels = copyUint8Pixels(rgbFrame)
          const uprightPixels = rasterizePresentedFramePixels(frame)
          const referencePixels = createScaleReferences(
            uprightPixels,
            FORMAT_WIDTH,
            FORMAT_HEIGHT,
          ).stretch
          redBlueOrder = compareRedBlueOrder(referencePixels, rgbPixels)
          if (
            redBlueOrder.distinctPixelRatio >= MIN_DISTINCT_RED_BLUE_RATIO &&
            redBlueOrder.intendedMeanDifference <
              redBlueOrder.swappedMeanDifference
          ) {
            break
          }

          rgbFrame.dispose()
          rgbFrame = undefined
          frame.dispose()
          frame = undefined
          if (attempt + 1 < MAX_FRAME_ATTEMPTS) {
            receivedFrame = deferred<Frame>()
            isWaitingForFrame = true
            didCapture.setBlocking(false)
          }
        }
        runtime.setOnFrameCallback(frameOutput, undefined)
        if (
          frame == null ||
          rgbFrame == null ||
          rgbPixels == null ||
          redBlueOrder == null ||
          redBlueOrder.distinctPixelRatio < MIN_DISTINCT_RED_BLUE_RATIO ||
          redBlueOrder.intendedMeanDifference >=
            redBlueOrder.swappedMeanDifference
        ) {
          throw new Error(
            `resizer formats: ${MAX_FRAME_ATTEMPTS} real Camera Frames could not independently verify RGB/BGR order (distinct-red-blue=${redBlueOrder?.distinctPixelRatio.toFixed(3)}, rgb-error=${redBlueOrder?.intendedMeanDifference.toFixed(2)}, swapped-error=${redBlueOrder?.swappedMeanDifference.toFixed(2)})`,
          )
        }
        const capturedFrame = frame
        const capturedRgbFrame = rgbFrame

        try {
          expect(() => rgbResizer.resize(capturedFrame)).toThrow()
          expectGpuFrameMetadata(
            capturedRgbFrame,
            'rgb',
            'uint8',
            'interleaved',
            1,
          )
        } finally {
          capturedRgbFrame.dispose()
          rgbFrame = undefined
        }
        expect(() => capturedRgbFrame.width).toThrow()
        expect(() => capturedRgbFrame.getPixelBuffer()).toThrow()

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

        const comparison = compareFormats(
          rgbPixels,
          bgrPixels,
          planarPixels,
          int8Pixels,
          float16Pixels,
          float32Pixels,
        )
        expect(redBlueOrder.distinctPixelRatio).toBeGreaterThanOrEqual(
          MIN_DISTINCT_RED_BLUE_RATIO,
        )
        expect(redBlueOrder.intendedMeanDifference).toBeLessThan(
          redBlueOrder.swappedMeanDifference,
        )
        expect(comparison.firstExactMismatch).toBeUndefined()
        expect(comparison.maximumFloat16Error).toBeLessThanOrEqual(0.005)
        expect(comparison.maximumFloat32Error).toBeLessThanOrEqual(1 / 255)
      } finally {
        isWaitingForFrame = false
        runtime.setOnFrameCallback(frameOutput, undefined)
        rgbFrame?.dispose()
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

async function createTestResizers(
  options: readonly ResizerOptions[],
): Promise<Resizer[]> {
  const resizers: Resizer[] = []
  try {
    for (const resizerOptions of options) {
      resizers.push(await createResizer(resizerOptions))
    }
    return resizers
  } catch (error) {
    for (const resizer of resizers) {
      resizer.dispose()
    }
    throw error
  }
}

function rasterizePresentedFramePixels(frame: Frame) {
  const convertedImage = HybridFrameConverter.convertFrameToImage(frame)
  try {
    const presentedImage = convertedImage.resize(
      convertedImage.width,
      convertedImage.height,
    )
    try {
      return presentedImage.toRawPixelData()
    } finally {
      presentedImage.dispose()
    }
  } finally {
    convertedImage.dispose()
  }
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

function expectGpuPixelsToMatchScaleMode(
  gpuPixels: Uint8Array,
  references: ScaleReferences,
  label: string,
  scaleMode: (typeof RESIZER_SCALE_MODES)[number],
): void {
  const comparison = comparePixels(
    gpuPixels,
    references,
    scaleMode,
    REFERENCE_WIDTH,
    REFERENCE_HEIGHT,
  )
  const acceptance = evaluatePixelComparison(comparison)
  const labelledFailures = acceptance.failures.map(
    (failure) => `${label}: ${failure}`,
  )
  expect(labelledFailures).toEqual([])
}

function frameConfigurationKey(
  orientation: CameraOrientation,
  isMirrored: boolean,
): string {
  return `${orientation}/${isMirrored ? 'mirrored' : 'not-mirrored'}`
}
