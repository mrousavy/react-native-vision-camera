import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Photo', () => {
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

  // Verifies that `targetResolution` actually drives the output — without these,
  // a regression that snaps every request to a default smaller format would
  // pass all the other photo tests (they only assert width/height > 0).
  it("captures at the device's maximum supported photo resolution", async () => {
    const supportedPhotoResolutions =
      backDevice.getSupportedResolutions('photo')
    expect(supportedPhotoResolutions.length).toBeGreaterThan(0)
    const maxPhotoResolution = supportedPhotoResolutions.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: maxPhotoResolution,
      containerFormat: 'native',
      quality: 1,
      qualityPrioritization: 'quality',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: photoOutput }],
        initialZoom: backDevice.minZoom,
        initialExposureBias: 0,
      },
    ])
    if (controller == null) throw new Error('Expected a CameraController')
    await session.start()
    try {
      const requestedShortEdge = Math.min(
        maxPhotoResolution.width,
        maxPhotoResolution.height,
      )
      const requestedLongEdge = Math.max(
        maxPhotoResolution.width,
        maxPhotoResolution.height,
      )

      // currentResolution must reflect the resolved output size before we
      // even take the picture.
      const reported = photoOutput.currentResolution
      if (reported == null) throw new Error('Expected a currentResolution')
      expect(Math.min(reported.width, reported.height)).toBe(requestedShortEdge)
      expect(Math.max(reported.width, reported.height)).toBe(requestedLongEdge)

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      const capturedShortEdge = Math.min(photo.width, photo.height)
      const capturedLongEdge = Math.max(photo.width, photo.height)
      console.log(
        `max device res=${maxPhotoResolution.width}x${maxPhotoResolution.height} reported=${reported.width}x${reported.height} zoom=${controller.zoom} captured=${photo.width}x${photo.height}`,
      )
      expect(controller.zoom).toBeCloseTo(backDevice.minZoom)
      expect(capturedShortEdge).toBe(requestedShortEdge)
      expect(capturedLongEdge).toBe(requestedLongEdge)
      photo.dispose()
    } finally {
      await session.stop()
    }
  })
})
