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
    await VisionCamera.requestCameraPermission()
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

  it('saves a JPEG Photo to a temporary file after converting it to an Image', async () => {
    // Regression: on Android, `toImageAsync()` goes through CameraX's
    // `jpegImageToJpegByteArray`, which advances the JPEG plane's `ByteBuffer`
    // position to `capacity`. The plane buffer is shared across reads (Android's
    // `ImageReader` caches the same `ByteBuffer` instance), so a subsequent
    // `saveToTemporaryFileAsync()` that reads `buffer.remaining()` would write a
    // 0-byte file, and `ExifInterface.saveAttributes()` would then throw
    // "ExifInterface only supports saving attributes for JPEG, PNG, and WebP
    // formats" because it cannot sniff the MIME type of an empty file.
    // See `HybridPhoto.kt#saveToFile`.
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
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

    const image = await photo.toImageAsync()
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
    image.dispose()

    const path = await photo.saveToTemporaryFileAsync()
    expect(path.length).toBeGreaterThan(0)
    photo.dispose()

    await session.stop()
  })

  // TODO: Re-enable once VisionCamera exposes a way to query supported photo
  //       container formats upfront (see the TODO in CameraPhotoOutput.nitro.ts
  //       near `TargetPhotoContainerFormat`). Without that API there is no
  //       precondition to gate on, and the HEIC path throws at configure time
  //       on devices that do not support the format.
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

  // TODO: Re-enable once VisionCamera exposes a way to query RAW / DNG support
  //       upfront. Today the CameraX DngCreator path also crashes natively on
  //       some devices with a buffer-size assertion
  //       (java.lang.AssertionError: Height and width of image buffer did not
  //       match height and width of either the preCorrectionActiveArraySize or
  //       the pixelArraySize.) — see androidx.camera.core.imagecapture.DngImage2Disk.
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

  // Verifies that `targetResolution` actually drives the output — without these,
  // a regression that snaps every request to a default smaller format would
  // pass all the other photo tests (they only assert width/height > 0).
  it("captures at the device's maximum supported photo resolution", async () => {
    const supported = backDevice.getSupportedResolutions('photo')
    expect(supported.length).toBeGreaterThan(0)
    const max = supported.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: max,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'quality',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: photoOutput }],
      },
    ])
    await session.start()
    try {
      const requestedShortEdge = Math.min(max.width, max.height)
      const requestedLongEdge = Math.max(max.width, max.height)

      // currentResolution must reflect the resolved output size before we
      // even take the picture.
      const reported = photoOutput.currentResolution
      expect(reported).toBeDefined()
      expect(Math.min(reported!.width, reported!.height)).toBe(
        requestedShortEdge,
      )
      expect(Math.max(reported!.width, reported!.height)).toBe(
        requestedLongEdge,
      )

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      const capturedShortEdge = Math.min(photo.width, photo.height)
      const capturedLongEdge = Math.max(photo.width, photo.height)
      console.log(
        `max device res=${max.width}x${max.height} reported=${reported!.width}x${reported!.height} captured=${photo.width}x${photo.height}`,
      )
      expect(capturedShortEdge).toBe(requestedShortEdge)
      expect(capturedLongEdge).toBe(requestedLongEdge)
      photo.dispose()
    } finally {
      await session.stop()
    }
  })

  it("captures at the device's minimum supported photo resolution", async () => {
    const supported = backDevice.getSupportedResolutions('photo')
    expect(supported.length).toBeGreaterThan(0)
    const min = supported.reduce((a, b) =>
      a.width * a.height < b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: min,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: photoOutput }],
      },
    ])
    await session.start()
    try {
      const requestedShortEdge = Math.min(min.width, min.height)
      const requestedLongEdge = Math.max(min.width, min.height)

      const reported = photoOutput.currentResolution
      expect(reported).toBeDefined()
      expect(Math.min(reported!.width, reported!.height)).toBe(
        requestedShortEdge,
      )
      expect(Math.max(reported!.width, reported!.height)).toBe(
        requestedLongEdge,
      )

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      const capturedShortEdge = Math.min(photo.width, photo.height)
      const capturedLongEdge = Math.max(photo.width, photo.height)
      console.log(
        `min device res=${min.width}x${min.height} reported=${reported!.width}x${reported!.height} captured=${photo.width}x${photo.height}`,
      )
      expect(capturedShortEdge).toBe(requestedShortEdge)
      expect(capturedLongEdge).toBe(requestedLongEdge)
      photo.dispose()
    } finally {
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
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    try {
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
      // Wait for the callbacks to drain BEFORE we stop the session, otherwise
      // pending callback invocations can be dropped.
      await waitUntil(
        () =>
          (willBegin >= 1 && willCapture >= 1 && didCapture >= 1) ||
          sessionError != null,
        { timeout: 5_000 },
      )
      expect(sessionError).toBe(undefined)
      photo.dispose()
    } finally {
      errorSub.remove()
      await session.stop()
    }

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
      switch (mirrorMode) {
        case 'off':
          expect(photo.isMirrored).toBe(false)
          break
        case 'on':
          expect(photo.isMirrored).toBe(true)
          break
        case 'auto':
          expect(photo.isMirrored).toBe(backDevice.position === 'front')
          break
      }
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

  it('reports supportsDepthDataDelivery on a depth-capable device', async () => {
    // `supportsDepthDataDelivery` is a per-output property that flips to `true`
    // once the photo output is bound to a device that can produce depth data.
    // The default back wide-angle on most phones does not — depth-capable
    // devices are typically TrueDepth (front) or LiDAR/Dual virtual cameras.
    // Pick whichever device on the system happens to support depth.
    const depthDevice = factory.cameraDevices.find(
      (d) => d.type === 'true-depth' || d.type === 'lidar-depth' || d.type === 'dual',
    )
    if (depthDevice == null) {
      console.log(
        '[SKIP] supportsDepthDataDelivery: no depth-capable device on this system',
      )
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
        input: depthDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    console.log(
      `photoOutput support flags: depthData=${photoOutput.supportsDepthDataDelivery} calibrationData=${photoOutput.supportsCameraCalibrationDataDelivery}`,
    )
    expect(photoOutput.supportsDepthDataDelivery).toBe(true)
  })
})
