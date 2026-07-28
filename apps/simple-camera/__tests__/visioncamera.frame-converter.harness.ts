import { Platform } from 'react-native'
import { beforeAll, describe, expect, it } from 'react-native-harness'
import type { Image } from 'react-native-nitro-image'
import type {
  CameraDevice,
  CameraDeviceFactory,
  Frame,
  MirrorMode,
} from 'react-native-vision-camera'
import {
  CommonResolutions,
  HybridFrameConverter,
  VisionCamera,
} from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import {
  compareImageToFrameLuma,
  FRAME_CONVERTER_ORIENTATIONS,
  type FrameLumaPlane,
} from './frame-converter-test-utils'
import { deferred, withTimeout } from './test-utils'

const mirrorModes = ['off', 'on'] satisfies MirrorMode[]
const maximumSignalAttempts = 5

type RawPixelData = ReturnType<Image['toRawPixelData']>

describe('VisionCamera - Frame Converter', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  it('preserves spatial luma alignment across the orientation/mirror matrix and sync/async paths', async () => {
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
    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    const sessionFailed = deferred<never>()
    const errorSubscription = session.addOnErrorListener(sessionFailed.reject)
    const verifiedCases = new Set<string>()
    let didStart = false

    const captureFrame = async (label: string): Promise<Frame> => {
      const receivedFrame = deferred<Frame>()
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

        // Drain Frames queued before the latest orientation or mirror change.
        if (frameNumber < 2 || didCapture.getBlocking()) {
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

      try {
        return await Promise.race([
          withTimeout(receivedFrame.promise, 15_000, `receive ${label} Frame`),
          sessionFailed.promise,
        ])
      } finally {
        isWaitingForFrame = false
        runtime.setOnFrameCallback(frameOutput, undefined)
      }
    }

    try {
      for (const mirrorMode of mirrorModes) {
        frameOutput.outputOrientation = 'up'
        await session.configure([
          {
            input: backDevice,
            outputs: [{ output: frameOutput, mirrorMode }],
            constraints: [],
          },
        ])
        if (!didStart) {
          await session.start()
          didStart = true
        }

        for (const outputOrientation of FRAME_CONVERTER_ORIENTATIONS) {
          frameOutput.outputOrientation = outputOrientation
          const label = `output=${outputOrientation}, mirror=${mirrorMode}`
          let didVerifyCase = false

          for (let attempt = 1; attempt <= maximumSignalAttempts; attempt++) {
            const frame = await captureFrame(label)
            try {
              expect(frame.isValid, `${label}: Frame validity`).toBe(true)
              expect(frame.isPlanar, `${label}: YUV Frame layout`).toBe(true)
              expect(frame.isMirrored, `${label}: Frame mirror metadata`).toBe(
                mirrorMode === 'on',
              )

              const isSideways =
                frame.orientation === 'left' || frame.orientation === 'right'
              const expectedWidth = isSideways ? frame.height : frame.width
              const expectedHeight = isSideways ? frame.width : frame.height

              const syncImage = HybridFrameConverter.convertFrameToImage(frame)
              let syncPixels: RawPixelData
              try {
                expect(syncImage.width, `${label}: sync Image width`).toBe(
                  expectedWidth,
                )
                expect(syncImage.height, `${label}: sync Image height`).toBe(
                  expectedHeight,
                )
                syncPixels = imageToUprightPixels(syncImage)
              } finally {
                syncImage.dispose()
              }

              const lumaMatch = compareImageToFrameLuma(
                getFrameLumaPlane(frame),
                syncPixels,
                frame.orientation,
                frame.isMirrored,
              )
              if (!lumaMatch.hasUsableSignal) {
                continue
              }

              expect(
                lumaMatch.intendedCorrelation,
                `${label}: intended raw-Y spatial correlation`,
              ).toBeGreaterThanOrEqual(0.8)
              const alignmentLead =
                lumaMatch.intendedCorrelation -
                lumaMatch.strongestWrongCorrelation
              expect(
                alignmentLead,
                `${label}: intended correlation lead over the strongest wrong orientation/mirror`,
              ).toBeGreaterThan(0.05)

              // Native conversion is not cancellable. Await it directly so
              // the Frame and resulting Image always have scoped ownership.
              const asyncImage =
                await HybridFrameConverter.convertFrameToImageAsync(frame)
              let asyncPixels: RawPixelData
              try {
                expect(asyncImage.width, `${label}: async Image width`).toBe(
                  expectedWidth,
                )
                expect(asyncImage.height, `${label}: async Image height`).toBe(
                  expectedHeight,
                )
                asyncPixels = imageToUprightPixels(asyncImage)
              } finally {
                asyncImage.dispose()
              }

              expectRawPixelsToBeEqual(syncPixels, asyncPixels, label)
              verifiedCases.add(
                `${frame.orientation}/${String(frame.isMirrored)}`,
              )
              didVerifyCase = true
              break
            } finally {
              frame.dispose()
            }
          }

          if (!didVerifyCase) {
            throw new Error(
              `${label}: no spatially distinct Camera Frame after ${maximumSignalAttempts} attempts`,
            )
          }
        }
      }

      const expectedCases = FRAME_CONVERTER_ORIENTATIONS.flatMap(
        (orientation) =>
          [false, true].map((isMirrored) => `${orientation}/${isMirrored}`),
      )
      expect([...verifiedCases].sort()).toEqual(expectedCases.sort())
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSubscription.remove()
      if (didStart) {
        await session.stop()
      }
    }
  })
})

/**
 * Frame conversion already creates a physically transformed Bitmap on Android.
 * On iOS, Nitro Image preserves UIImage orientation as metadata, so drawing
 * once makes the transform observable in the returned raw pixels.
 */
function imageToUprightPixels(image: Image): RawPixelData {
  if (Platform.OS !== 'ios') {
    return image.toRawPixelData()
  }

  const uprightImage = image.resize(image.width, image.height)
  try {
    return uprightImage.toRawPixelData()
  } finally {
    uprightImage.dispose()
  }
}

function getFrameLumaPlane(frame: Frame): FrameLumaPlane {
  const yPlane = frame.getPlanes()[0]
  if (yPlane == null) {
    throw new Error('YUV Frame did not contain a Y plane')
  }
  return {
    pixels: new Uint8Array(yPlane.getPixelBuffer()),
    width: frame.width,
    height: frame.height,
    bytesPerRow: yPlane.bytesPerRow,
  }
}

function expectRawPixelsToBeEqual(
  first: RawPixelData,
  second: RawPixelData,
  label: string,
): void {
  expect(first.width, `${label}: sync/async pixel width`).toBe(second.width)
  expect(first.height, `${label}: sync/async pixel height`).toBe(second.height)
  expect(first.pixelFormat, `${label}: sync/async pixel format`).toBe(
    second.pixelFormat,
  )

  const firstPixels = new Uint8Array(first.buffer)
  const secondPixels = new Uint8Array(second.buffer)
  expect(
    firstPixels.byteLength,
    `${label}: sync pixel byte count`,
  ).toBeGreaterThan(0)
  expect(firstPixels.byteLength, `${label}: sync/async pixel byte count`).toBe(
    secondPixels.byteLength,
  )

  let differences = 0
  for (let index = 0; index < firstPixels.length; index++) {
    if (firstPixels[index] !== secondPixels[index]) {
      differences++
    }
  }
  expect(differences, `${label}: sync/async differing pixel bytes`).toBe(0)
}
