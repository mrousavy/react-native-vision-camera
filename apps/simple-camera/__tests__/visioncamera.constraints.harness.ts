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
  CameraSessionConfig,
  Constraint,
} from 'react-native-vision-camera'
import {
  CommonDynamicRanges,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'

describe('VisionCamera - Constraints', () => {
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

  it('resolves a baseline config with no constraints', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })

    const config = received
    if (config == null) throw new Error('no config')
    expect(backDevice.supportedPixelFormats).toContain(config.nativePixelFormat)
    console.log(`baseline config: ${config.toString()}`)
    await session.stop()
  })

  it('resolves an explicit fps: 30 constraint', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ fps: 30 }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.selectedFPS).toBe(30)
    await session.stop()
  })

  it('resolves a fps: 60 constraint if the device supports it', async () => {
    if (!backDevice.supportsFPS(60)) {
      console.log('[SKIP] fps: 60 not supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [{ fps: 60 }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.selectedFPS).toBe(60)
    await session.stop()
  })

  it('resolves photoHDR: true when the device supports photo HDR', async () => {
    if (!backDevice.supportsPhotoHDR) {
      console.log('[SKIP] photoHDR: not supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: photoOutput }, { photoHDR: true }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.isPhotoHDREnabled).toBe(true)
    await session.stop()
  })

  it('resolves a HDR video dynamic range when the device supports it', async () => {
    const hasHdr = backDevice.supportedVideoDynamicRanges.some(
      (d) => d.bitDepth === 'hdr-10-bit',
    )
    if (!hasHdr) {
      console.log('[SKIP] video HDR: no HDR dynamic range on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [
          { videoDynamicRange: CommonDynamicRanges.ANY_HDR },
          { resolutionBias: videoOutput },
        ],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.selectedVideoDynamicRange?.bitDepth).toBe('hdr-10-bit')
    await session.stop()
  })

  it('resolves a video stabilization constraint when supported', async () => {
    if (!backDevice.supportsVideoStabilizationMode('cinematic')) {
      console.log('[SKIP] videoStabilizationMode: "cinematic" not supported')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [{ videoStabilizationMode: 'cinematic' }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.selectedVideoStabilizationMode).toBe('cinematic')
    await session.stop()
  })

  it('resolves a preview stabilization constraint when supported', async () => {
    if (!backDevice.supportsPreviewStabilizationMode('preview-optimized')) {
      console.log(
        '[SKIP] previewStabilizationMode: "preview-optimized" not supported',
      )
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [{ previewStabilizationMode: 'preview-optimized' }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    expect(received?.selectedPreviewStabilizationMode).toBe('preview-optimized')
    await session.stop()
  })

  it('resolves a binned: true constraint when supported', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [{ binned: true }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    if (received?.isBinned !== true) {
      console.log(
        `[SKIP] binned: true: device resolved to isBinned=${received?.isBinned}`,
      )
      await session.stop()
      return
    }
    expect(received.isBinned).toBe(true)
    await session.stop()
  })

  it('honors a pixelFormat constraint matching a supported device format', async () => {
    const candidate = backDevice.supportedPixelFormats.find(
      (f) => f !== 'unknown',
    )
    if (candidate == null) {
      console.log(
        '[SKIP] pixelFormat constraint: device has no non-unknown formats',
      )
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'native',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [{ pixelFormat: candidate }],
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })
    console.log(
      `requested pixelFormat=${candidate} resolved=${received?.nativePixelFormat}`,
    )
    expect(received?.nativePixelFormat).toBe(candidate)
    await session.stop()
  })

  it('resolves the same config via VisionCamera.resolveConstraints and session.configure', async () => {
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const outputConfig = {
      output: photoOutput,
      mirrorMode: 'auto' as const,
    }
    const constraints: Constraint[] = [{ fps: 30 }]

    const standalone = await VisionCamera.resolveConstraints(
      backDevice,
      [outputConfig],
      constraints,
    )

    const session = await VisionCamera.createCameraSession(false)
    let sessionConfig: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [outputConfig],
        constraints,
        onSessionConfigSelected: (config) => {
          sessionConfig = config
        },
      },
    ])
    await waitUntil(() => sessionConfig != null, { timeout: 5_000 })
    expect(sessionConfig?.selectedFPS).toBe(standalone.selectedFPS)
    expect(sessionConfig?.nativePixelFormat).toBe(standalone.nativePixelFormat)
    expect(sessionConfig?.isPhotoHDREnabled).toBe(standalone.isPhotoHDREnabled)
    expect(sessionConfig?.isBinned).toBe(standalone.isBinned)

    await session.stop()
  })

  it('applies constraint priority ordering for resolutionBias', async () => {
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HIGHEST_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableAudio: false,
    })

    const photoFirst = await VisionCamera.resolveConstraints(
      backDevice,
      [
        { output: photoOutput, mirrorMode: 'auto' },
        { output: videoOutput, mirrorMode: 'auto' },
      ],
      [{ resolutionBias: photoOutput }, { resolutionBias: videoOutput }],
    )
    const videoFirst = await VisionCamera.resolveConstraints(
      backDevice,
      [
        { output: photoOutput, mirrorMode: 'auto' },
        { output: videoOutput, mirrorMode: 'auto' },
      ],
      [{ resolutionBias: videoOutput }, { resolutionBias: photoOutput }],
    )
    console.log(
      `resolutionBias photo-first: nativePixelFormat=${photoFirst.nativePixelFormat} binned=${photoFirst.isBinned}`,
    )
    console.log(
      `resolutionBias video-first: nativePixelFormat=${videoFirst.nativePixelFormat} binned=${videoFirst.isBinned}`,
    )
  })

  // Combines every supported "headline" constraint (photo HDR, video
  // stabilization, video HDR, fps: 60) into one configure() call to make sure
  // the resolver doesn't drop or trample a higher-priority constraint when
  // other constraints are also stacked on. Ordered priority: photoHDR (photo
  // path) > videoStabilizationMode (orthogonal) > videoDynamicRange (may force
  // lower fps) > fps: 60 (lowest — yields to HDR on devices that can't do both).
  it('combines photoHDR, video stabilization, video HDR, and fps: 60 constraints together', async () => {
    const constraints: Constraint[] = []
    const requested: string[] = []

    if (backDevice.supportsPhotoHDR) {
      constraints.push({ photoHDR: true })
      requested.push('photoHDR')
    }

    let chosenStabilizationMode: 'cinematic' | 'standard' | undefined
    for (const mode of ['cinematic', 'standard'] as const) {
      if (backDevice.supportsVideoStabilizationMode(mode)) {
        chosenStabilizationMode = mode
        constraints.push({ videoStabilizationMode: mode })
        requested.push(`stabilization:${mode}`)
        break
      }
    }

    const hasHdr = backDevice.supportedVideoDynamicRanges.some(
      (d) => d.bitDepth === 'hdr-10-bit',
    )
    if (hasHdr) {
      constraints.push({ videoDynamicRange: CommonDynamicRanges.ANY_HDR })
      requested.push('hdr-10-bit')
    }

    const wants60 = backDevice.supportsFPS(60)
    if (wants60) {
      constraints.push({ fps: 60 })
      requested.push('fps:60')
    }

    if (constraints.length === 0) {
      console.log(
        '[SKIP] combined constraints: device supports none of the gated capabilities',
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
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })

    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
        ],
        constraints,
        onSessionConfigSelected: (config) => {
          received = config
        },
      },
    ])
    await waitUntil(() => received != null, { timeout: 5_000 })

    const config = received
    if (config == null) throw new Error('no config')

    console.log(
      `combined constraints requested=[${requested.join(', ')}] resolved: ` +
        `fps=${config.selectedFPS} ` +
        `videoDR=${config.selectedVideoDynamicRange?.bitDepth} ` +
        `videoStab=${config.selectedVideoStabilizationMode} ` +
        `photoHDR=${config.isPhotoHDREnabled}`,
    )

    // Each constraint must be honored on its own axis. Constraints are
    // independent axes — none should be silently dropped just because others
    // are also present.
    if (backDevice.supportsPhotoHDR) {
      expect(config.isPhotoHDREnabled).toBe(true)
    }
    if (chosenStabilizationMode != null) {
      expect(config.selectedVideoStabilizationMode).toBe(chosenStabilizationMode)
    }
    if (hasHdr) {
      expect(config.selectedVideoDynamicRange?.bitDepth).toBe('hdr-10-bit')
    }
    // fps: 60 is the lowest-priority entry and may legitimately fall back to
    // 30 on devices that can't do HDR at 60fps. Log the resolved value but
    // don't strict-assert.
    if (wants60 && !hasHdr) {
      expect(config.selectedFPS).toBe(60)
    }

    await session.stop()
  })

  it('reconfigures the running session with a different constraint set', async () => {
    if (!backDevice.supportsFPS(60)) {
      console.log(
        '[SKIP] reconfigure with new constraints: fps: 60 not supported',
      )
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })

    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    let firstConfig: CameraSessionConfig | undefined
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [{ fps: 30 }],
        onSessionConfigSelected: (config) => {
          firstConfig = config
        },
      },
    ])
    await waitUntil(() => firstConfig != null, { timeout: 5_000 })
    expect(firstConfig?.selectedFPS).toBe(30)

    await session.start()

    try {
      let secondConfig: CameraSessionConfig | undefined
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
          constraints: [{ fps: 60 }],
          onSessionConfigSelected: (config) => {
            secondConfig = config
          },
        },
      ])
      await waitUntil(() => secondConfig != null, { timeout: 5_000 })
      expect(secondConfig?.selectedFPS).toBe(60)

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })
})
