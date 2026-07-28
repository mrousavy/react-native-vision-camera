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
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

const conversionCases = [
  { outputOrientation: 'up', mirrorMode: 'off' },
  { outputOrientation: 'right', mirrorMode: 'on' },
  { outputOrientation: 'down', mirrorMode: 'off' },
  { outputOrientation: 'left', mirrorMode: 'on' },
] satisfies {
  outputOrientation: CameraOrientation
  mirrorMode: MirrorMode
}[]

type RawPixelData = ReturnType<Image['toRawPixelData']>

describe('VisionCamera - Frame Converter', () => {
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
    expect([...observedOrientations].sort()).toEqual(
      ['up', 'right', 'down', 'left'].sort(),
    )
    expect([...observedMirrorStates].sort()).toEqual([false, true])
  })

  for (const { outputOrientation, mirrorMode } of conversionCases) {
    it(`converts a real Camera Frame for output=${outputOrientation}, mirror=${mirrorMode}`, async () => {
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
            `receive ${outputOrientation}/${mirrorMode} Camera Frame`,
          ),
          sessionFailed.promise,
        ])
        runtime.setOnFrameCallback(frameOutput, undefined)

        expect(frame.isValid).toBe(true)
        expect(frame.isPlanar).toBe(true)
        expect(frame.isMirrored).toBe(mirrorMode === 'on')
        observedOrientations.add(frame.orientation)
        observedMirrorStates.add(frame.isMirrored)

        const isSideways =
          frame.orientation === 'left' || frame.orientation === 'right'
        const expectedImageWidth = isSideways ? frame.height : frame.width
        const expectedImageHeight = isSideways ? frame.width : frame.height
        const syncImage = HybridFrameConverter.convertFrameToImage(frame)
        let syncPixels: RawPixelData
        try {
          expect(syncImage.width).toBe(expectedImageWidth)
          expect(syncImage.height).toBe(expectedImageHeight)
          syncPixels = imageToUprightPixels(syncImage)
        } finally {
          syncImage.dispose()
        }

        const asyncImage = await withTimeout(
          HybridFrameConverter.convertFrameToImageAsync(frame),
          15_000,
          'convert Camera Frame to Image asynchronously',
        )
        let asyncPixels: RawPixelData
        try {
          expect(asyncImage.width).toBe(expectedImageWidth)
          expect(asyncImage.height).toBe(expectedImageHeight)
          asyncPixels = imageToUprightPixels(asyncImage)
        } finally {
          asyncImage.dispose()
        }

        expectRawPixelsToBeEqual(syncPixels, asyncPixels)
        console.log(
          `Frame Converter: target=${outputOrientation}, frame=${frame.orientation}, mirrored=${frame.isMirrored}, size=${syncPixels.width}x${syncPixels.height}`,
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
    })
  }
})

/**
 * Nitro Image preserves UIImage orientation as metadata on iOS. Drawing once
 * makes the orientation and mirroring observable in the returned raw pixels.
 */
function imageToUprightPixels(image: Image): RawPixelData {
  const uprightImage = image.resize(image.width, image.height)
  try {
    return uprightImage.toRawPixelData()
  } finally {
    uprightImage.dispose()
  }
}

function expectRawPixelsToBeEqual(
  first: RawPixelData,
  second: RawPixelData,
): void {
  expect(first.width).toBe(second.width)
  expect(first.height).toBe(second.height)
  expect(first.pixelFormat).toBe(second.pixelFormat)

  const firstPixels = new Uint8Array(first.buffer)
  const secondPixels = new Uint8Array(second.buffer)
  expect(firstPixels.byteLength).toBeGreaterThan(0)
  expect(firstPixels.byteLength).toBe(secondPixels.byteLength)

  let differences = 0
  for (let index = 0; index < firstPixels.length; index++) {
    if (firstPixels[index] !== secondPixels[index]) {
      differences++
    }
  }
  expect(differences).toBe(0)
}
