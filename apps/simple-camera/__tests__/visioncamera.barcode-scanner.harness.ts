import { Image as RNImage } from 'react-native'
import { beforeAll, describe, expect, it } from 'react-native-harness'
import type { Image as NitroImage } from 'react-native-nitro-image'
import { loadImage } from 'react-native-nitro-image'
import type {
  CameraDevice,
  CameraDeviceFactory,
  Frame,
  TargetVideoPixelFormat,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import {
  type Barcode,
  createBarcodeScanner,
  type TargetBarcodeFormat,
} from 'react-native-vision-camera-barcode-scanner'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

const qrCodeAsset = require('../src/assets/qr-code-margelo.png')
const code128Asset = require('../src/assets/code-128-mrousavy.png')

describe('VisionCamera - Barcode Scanner', () => {
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

  it('scans a QR code from a Nitro Image', async () => {
    const barcodes = await scanCodesInAssetImage(qrCodeAsset, ['qr-code'])

    expect(barcodes).toHaveLength(1)
    expect(barcodes[0]?.format).toBe('qr-code')
    expect(barcodes[0]?.rawValue).toBe('https://margelo.com')
  })

  it('scans a Code 128 barcode from a Nitro Image', async () => {
    const code128Barcodes = await scanCodesInAssetImage(code128Asset, [
      'code-128',
    ])

    expect(code128Barcodes).toHaveLength(1)
    expect(code128Barcodes[0]?.format).toBe('code-128')
    expect(code128Barcodes[0]?.rawValue).toBe('https://mrousavy.com')

    const allFormatBarcodes = await scanCodesInAssetImage(code128Asset, [
      'all-formats',
    ])

    expect(allFormatBarcodes).toHaveLength(1)
    expect(allFormatBarcodes[0]?.format).toBe('code-128')
    expect(allFormatBarcodes[0]?.rawValue).toBe('https://mrousavy.com')
  })

  for (const pixelFormat of ['yuv', 'rgb'] satisfies TargetVideoPixelFormat[]) {
    it(`accepts a real ${pixelFormat.toUpperCase()} Camera Frame`, async () => {
      const session = await VisionCamera.createCameraSession(false)
      const frameOutput = VisionCamera.createFrameOutput({
        targetResolution: CommonResolutions.VGA_4_3,
        pixelFormat,
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

      const scanner = createBarcodeScanner({
        barcodeFormats: ['all-formats'],
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
            `receive ${pixelFormat} Camera Frame`,
          ),
          sessionFailed.promise,
        ])
        runtime.setOnFrameCallback(frameOutput, undefined)

        // The live scene does not need to contain a barcode. Returning from
        // the synchronous production path proves ML Kit accepted the Frame.
        scanner.scanCodes(frame)
      } finally {
        isWaitingForFrame = false
        runtime.setOnFrameCallback(frameOutput, undefined)
        frame?.dispose()
        scanner.dispose()
        errorSubscription.remove()
        if (didStart) {
          await session.stop()
        }
      }
    })
  }
})

async function scanCodesInAssetImage(
  source: number,
  barcodeFormats: TargetBarcodeFormat[],
): Promise<Barcode[]> {
  const image = await loadNitroImageFromAsset(source)
  return await scanLoadedImage(image, barcodeFormats)
}

async function loadNitroImageFromAsset(source: number): Promise<NitroImage> {
  const resolvedSource = RNImage.resolveAssetSource(source)
  const response = await fetch(resolvedSource.uri)
  const buffer = await response.arrayBuffer()

  return await loadImage({
    encodedImageData: {
      buffer,
      width: resolvedSource.width,
      height: resolvedSource.height,
      imageFormat: 'png',
    },
  })
}

async function scanLoadedImage(
  image: NitroImage,
  barcodeFormats: TargetBarcodeFormat[],
): Promise<Barcode[]> {
  const scanner = createBarcodeScanner({ barcodeFormats })
  try {
    return await withTimeout(
      scanner.scanCodesInImageAsync(image),
      15_000,
      `scan ${barcodeFormats.join(', ')} from image`,
    )
  } finally {
    scanner.dispose()
    image.dispose()
  }
}
