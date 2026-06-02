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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

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
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
    image.dispose()
    photo.dispose()

    await session.stop()
  })

  it('checks and reads a native Photo pixel buffer in-memory', async (context) => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 1,
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
    try {
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      try {
        expect(photo.width).toBeGreaterThan(0)
        expect(photo.height).toBeGreaterThan(0)
        if (!photo.hasPixelBuffer) {
          return context.skip(
            'Photo pixel buffer: captured native photo has no pixel buffer',
          )
        }

        const pixelBuffer = photo.getPixelBuffer()
        expect(pixelBuffer.byteLength).toBeGreaterThan(0)
        const view = new Uint8Array(pixelBuffer)
        expect(view[0]).toBeGreaterThanOrEqual(0)
      } finally {
        photo.dispose()
      }
    } finally {
      await session.stop()
    }
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
    // File paths must start with "/" and end with ".jpeg" or ".jpg".
    expect(path).toMatch(/^\/.*\.(jpeg|jpg)$/)
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

  it('captures with speed qualityPrioritization when supported', async (context) => {
    if (!backDevice.supportsSpeedQualityPrioritization) {
      return context.skip(
        'qualityPrioritization: speed not supported on device',
      )
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'speed',
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
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: photoOutput }],
        initialZoom: backDevice.minZoom,
        initialExposureBias: 0,
      },
    ])
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
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported photo resolution')
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      expect(reportedShortEdge).toBe(requestedShortEdge)
      expect(reportedLongEdge).toBe(requestedLongEdge)

      // TODO: Figure out why we need prepareSettings + 1s sleep to capture max res????
      // Prepare default settings on the Photo Output before capturing,
      // and add an artificial 1 second timeout.
      // This is for some reason required for max res capture on iOS as
      // otherwise the pipeline is not ready for 48MP+ capture (possibly a
      // race condition inside AVFoundation?) and would give us binned (eg 24MP)
      // photos instead - maybe because it tries to give a photo quickly while
      // 48MP is still being warmed up? No idea. Bad DX imo.
      await photoOutput.prepareSettings([{}])
      await sleep(1000)

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      const capturedShortEdge = Math.min(photo.width, photo.height)
      const capturedLongEdge = Math.max(photo.width, photo.height)
      console.log(
        `max device res=${maxPhotoResolution.width}x${maxPhotoResolution.height} reported=${reported.width}x${reported.height} captured=${photo.width}x${photo.height}`,
      )
      expect(capturedShortEdge).toBe(requestedShortEdge)
      expect(capturedLongEdge).toBe(requestedLongEdge)
      photo.dispose()
    } finally {
      await session.stop()
    }
  })

  it("captures at the device's minimum supported photo resolution", async () => {
    const supportedPhotoResolutions =
      backDevice.getSupportedResolutions('photo')
    expect(supportedPhotoResolutions.length).toBeGreaterThan(0)
    const minPhotoResolution = supportedPhotoResolutions.reduce((a, b) =>
      a.width * a.height < b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: minPhotoResolution,
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
      const requestedShortEdge = Math.min(
        minPhotoResolution.width,
        minPhotoResolution.height,
      )
      const requestedLongEdge = Math.max(
        minPhotoResolution.width,
        minPhotoResolution.height,
      )

      const reported = photoOutput.currentResolution
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported photo resolution')
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      expect(reportedShortEdge).toBe(requestedShortEdge)
      expect(reportedLongEdge).toBe(requestedLongEdge)

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      const capturedShortEdge = Math.min(photo.width, photo.height)
      const capturedLongEdge = Math.max(photo.width, photo.height)
      console.log(
        `min device res=${minPhotoResolution.width}x${minPhotoResolution.height} reported=${reported.width}x${reported.height} captured=${photo.width}x${photo.height}`,
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

  it('delivers a preview image when previewImageTargetSize is set and the device supports it', async (context) => {
    if (!backDevice.supportsPreviewImage) {
      return context.skip(
        'onPreviewImageAvailable: device has no preview image support',
      )
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

  it('captures with flashMode on when the device has flash', async (context) => {
    if (!backDevice.hasFlash) {
      return context.skip('flashMode on: device has no flash')
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
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    const photo = await photoOutput.capturePhoto(
      { flashMode: 'on', enableShutterSound: false },
      {},
    )
    expect(photo.width).toBeGreaterThan(0)
    photo.dispose()
    await session.stop()
  })

  it('prepares flash variants before capturing a photo', async () => {
    const preparedFlashModes: FlashMode[] = ['off', 'auto']
    if (backDevice.hasFlash) {
      preparedFlashModes.push('on')
    } else {
      console.log('[SKIP] prepareSettings flashMode on: device has no flash')
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.95,
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
      await photoOutput.prepareSettings(
        preparedFlashModes.map((flashMode) => ({
          flashMode,
          enableShutterSound: false,
        })),
      )

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

  it('applies enableDistortionCorrection when the device supports it', async (context) => {
    if (!backDevice.supportsDistortionCorrection) {
      return context.skip('enableDistortionCorrection: not supported on device')
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
        case 'auto': {
          const expectedMirrored = backDevice.position === 'front'
          expect(photo.isMirrored).toBe(expectedMirrored)
          break
        }
      }
      photo.dispose()
      await session.stop()
    }
  })

  it('captures a Photo from the default front camera', async () => {
    const front = factory.getDefaultCamera('front')
    expect(front).toBeDefined()
    if (front == null) throw new Error('no front camera')

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
    // File paths must start with "/" and end with ".jpeg" or ".jpg".
    expect(file1.filePath).toMatch(/^\/.*\.(jpeg|jpg)$/)
    expect(file2.filePath).toMatch(/^\/.*\.(jpeg|jpg)$/)
    expect(file1.filePath).not.toBe(file2.filePath)

    await session.stop()
  })

  it('reports supportsDepthDataDelivery on a depth-capable device', async (context) => {
    // `supportsDepthDataDelivery` is a per-output property that flips to `true`
    // once the photo output is bound to a device that can produce depth data.
    // The default back wide-angle on most phones does not — depth-capable
    // devices are typically TrueDepth (front) or LiDAR/Dual virtual cameras.
    // Pick whichever device on the system happens to support depth.
    const depthDevice = factory.cameraDevices.find(
      (d) =>
        d.type === 'true-depth' ||
        d.type === 'lidar-depth' ||
        d.type === 'dual',
    )
    if (depthDevice == null) {
      return context.skip(
        'supportsDepthDataDelivery: no depth-capable device on this system',
      )
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
    try {
      console.log(
        `photoOutput support flags: depthData=${photoOutput.supportsDepthDataDelivery} calibrationData=${photoOutput.supportsCameraCalibrationDataDelivery}`,
      )
      expect(photoOutput.supportsDepthDataDelivery).toBe(true)
    } finally {
      await session.stop()
    }
  })
})
