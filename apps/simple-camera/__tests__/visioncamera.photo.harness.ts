import { Platform } from 'react-native'
import {
  beforeAll,
  describe,
  expect,
  it,
  waitUntil,
} from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
  FlashMode,
  MirrorMode,
  QualityPrioritization,
  Size,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Photo', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  it('captures a JPEG Photo in-memory', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.FHD_4_3,
      containerFormat: 'jpeg',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    expect(photo.width).toBeGreaterThan(0)
    expect(photo.height).toBeGreaterThan(0)
    expect(photo.containerFormat).toBe('jpeg')
    expect(photo.isRawPhoto).toBe(false)

    const image = await photo.toImageAsync()
    expect(image).toBeDefined()
    image.dispose()
    photo.dispose()

    await session.stop()
  })

  // Re-enable once VisionCamera exposes a way to query supported photo
  // container formats upfront (see the TODO in CameraPhotoOutput.nitro.ts
  // near `TargetPhotoContainerFormat`). Without that API there is no
  // precondition to gate on, and the HEIC path throws at configure time
  // on devices that do not support the format.
  it.skip('captures a HEIC Photo', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.FHD_4_3,
      containerFormat: 'heic',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    try {
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await session.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()
    } finally {
      await session.stop()
    }
  })

  // Re-enable once VisionCamera exposes a way to query RAW / DNG support
  // upfront. Today the CameraX DngCreator path also crashes natively on
  // some devices with a buffer-size assertion
  // (java.lang.AssertionError: Height and width of image buffer did not
  // match height and width of either the preCorrectionActiveArraySize or
  // the pixelArraySize.) — see androidx.camera.core.imagecapture.DngImage2Disk.
  it.skip('captures a RAW DNG Photo to a file', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.FHD_4_3,
      containerFormat: 'dng',
      quality: 1.0,
      qualityPrioritization: 'quality',
    })
    try {
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'off' }],
          constraints: [],
        },
      ])
      await session.start()
      const file = await photoOutput.capturePhotoToFile(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(file.filePath.length).toBeGreaterThan(0)
    } finally {
      await session.stop()
    }
  })

  it('captures with each qualityPrioritization the device supports', async () => {
    const priorities: QualityPrioritization[] = ['quality', 'balanced']
    if (backDevice.supportsSpeedQualityPrioritization) {
      priorities.push('speed')
    } else {
      console.log('[SKIP] qualityPrioritization: speed not supported on device')
    }

    for (const qualityPrioritization of priorities) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization,
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await session.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      photo.dispose()
      await session.stop()
    }
  })

  it('captures at several target resolutions', async () => {
    const targets: Size[] = [
      CommonResolutions.HD_4_3,
      CommonResolutions.FHD_4_3,
      CommonResolutions.HIGHEST_4_3,
    ]
    for (const targetResolution of targets) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await session.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      console.log(
        `target=${targetResolution.width}x${targetResolution.height} => resolved=${photo.width}x${photo.height}`,
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()
      await session.stop()
    }
  })

  it('invokes all capture lifecycle callbacks', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    let willBegin = 0
    let willCapture = 0
    let didCapture = 0

    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {
        onWillBeginCapture: () => {
          willBegin++
        },
        onWillCapturePhoto: () => {
          willCapture++
        },
        onDidCapturePhoto: () => {
          didCapture++
        },
      },
    )
    photo.dispose()
    await session.stop()

    await waitUntil(
      () => willBegin >= 1 && willCapture >= 1 && didCapture >= 1,
      { timeout: 5_000 },
    )
    expect(willBegin).toBe(1)
    expect(willCapture).toBe(1)
    expect(didCapture).toBe(1)
  })

  it('delivers a preview image when previewImageTargetSize is set and the device supports it', async () => {
    if (!backDevice.supportsPreviewImage) {
      console.log(
        '[SKIP] onPreviewImageAvailable: device has no preview image support',
      )
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
      previewImageTargetSize: { width: 256, height: 192 },
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    let previewImageFired = false
    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {
        onPreviewImageAvailable: (image) => {
          previewImageFired = true
          image.dispose()
        },
      },
    )
    photo.dispose()
    await session.stop()

    await waitUntil(() => previewImageFired, { timeout: 5_000 })
  })

  it('captures with each flashMode the device supports', async () => {
    const modes: FlashMode[] = ['off', 'auto']
    if (backDevice.hasFlash) {
      modes.push('on')
    } else {
      console.log('[SKIP] flashMode on: device has no flash')
    }

    for (const flashMode of modes) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await session.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode, enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      photo.dispose()
      await session.stop()
    }
  })

  it('toggles enableShutterSound and enableRedEyeReduction without error', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    for (const enableShutterSound of [true, false]) {
      for (const enableRedEyeReduction of [true, false]) {
        const photo = await photoOutput.capturePhoto(
          { flashMode: 'off', enableShutterSound, enableRedEyeReduction },
          {},
        )
        expect(photo.width).toBeGreaterThan(0)
        photo.dispose()
      }
    }

    await session.stop()
  })

  it('applies enableDistortionCorrection when the device supports it', async () => {
    if (!backDevice.supportsDistortionCorrection) {
      console.log('[SKIP] enableDistortionCorrection: not supported on device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'off' }],
        constraints: [],
      },
    ])
    await session.start()

    const photo = await photoOutput.capturePhoto(
      {
        flashMode: 'off',
        enableShutterSound: false,
        enableDistortionCorrection: true,
      },
      {},
    )
    expect(photo.width).toBeGreaterThan(0)
    photo.dispose()
    await session.stop()
  })

  it('honors the mirrorMode on each output configuration', async () => {
    const modes: MirrorMode[] = ['off', 'on', 'auto']
    for (const mirrorMode of modes) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: photoOutput, mirrorMode }],
          constraints: [],
        },
      ])
      await session.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      console.log(
        `mirrorMode=${mirrorMode} => photo.isMirrored=${photo.isMirrored}`,
      )
      if (mirrorMode === 'on') expect(photo.isMirrored).toBe(true)
      if (mirrorMode === 'off') expect(photo.isMirrored).toBe(false)
      photo.dispose()
      await session.stop()
    }
  })

  it('captures a Photo from the default front camera', async () => {
    const front = factory.getDefaultCamera('front')
    expect(front).toBeDefined()
    if (front == null) return

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: front,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    expect(photo.width).toBeGreaterThan(0)
    photo.dispose()
    await session.stop()
  })

  it('writes different file paths for subsequent capturePhotoToFile calls', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const file1 = await photoOutput.capturePhotoToFile(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    const file2 = await photoOutput.capturePhotoToFile(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    expect(file1.filePath.length).toBeGreaterThan(0)
    expect(file2.filePath.length).toBeGreaterThan(0)
    expect(file1.filePath).not.toBe(file2.filePath)

    await session.stop()
  })

  it('exposes depth delivery support flags without throwing', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    console.log(
      `photoOutput support flags: depthData=${photoOutput.supportsDepthDataDelivery} calibrationData=${photoOutput.supportsCameraCalibrationDataDelivery}`,
    )
    if (Platform.OS === 'ios' && !photoOutput.supportsDepthDataDelivery) {
      console.log(
        '[SKIP] supportsDepthDataDelivery: not supported for this device/output combination',
      )
    }
  })
})
