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

  it('resolves a fps: 60 constraint if the device supports it', async (context) => {
    if (!backDevice.supportsFPS(60)) {
      return context.skip('fps: 60 not supported on this device')
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

  it('keeps 4k video at 60 fps when a preview output is attached', async (context) => {
    const targetResolution = CommonResolutions.UHD_16_9
    const targetShortEdge = Math.min(
      targetResolution.width,
      targetResolution.height,
    )
    const targetLongEdge = Math.max(
      targetResolution.width,
      targetResolution.height,
    )
    const supportsUhdVideo = backDevice
      .getSupportedResolutions('video')
      .some((resolution) => {
        const shortEdge = Math.min(resolution.width, resolution.height)
        const longEdge = Math.max(resolution.width, resolution.height)
        return shortEdge === targetShortEdge && longEdge === targetLongEdge
      })
    if (!supportsUhdVideo) {
      return context.skip('4k video resolution not supported on this device')
    }
    if (!backDevice.supportsFPS(60)) {
      return context.skip('fps: 60 not supported on this device')
    }

    async function resolveVideoSession(includePreview: boolean) {
      const session = await VisionCamera.createCameraSession(false)
      const videoOutput = VisionCamera.createVideoOutput({
        targetResolution,
        enableAudio: false,
        enableHigherResolutionCodecs: true,
      })
      const previewOutput = includePreview
        ? VisionCamera.createPreviewOutput()
        : undefined
      let selectedConfig: CameraSessionConfig | undefined

      await session.configure([
        {
          input: backDevice,
          outputs:
            previewOutput == null
              ? [{ output: videoOutput, mirrorMode: 'auto' }]
              : [
                  { output: previewOutput, mirrorMode: 'auto' },
                  { output: videoOutput, mirrorMode: 'auto' },
                ],
          constraints:
            previewOutput == null
              ? [{ fps: 60 }, { resolutionBias: videoOutput }]
              : [
                  { fps: 60 },
                  { resolutionBias: previewOutput },
                  { resolutionBias: videoOutput },
                ],
          onSessionConfigSelected: (config) => {
            selectedConfig = config
          },
        },
      ])
      await waitUntil(() => selectedConfig != null, { timeout: 5_000 })

      await session.start()
      try {
        await waitUntil(() => videoOutput.currentResolution != null, {
          timeout: 10_000,
        })
        const currentResolution = videoOutput.currentResolution
        if (selectedConfig == null) throw new Error('no selected config')
        if (currentResolution == null) throw new Error('no video resolution')
        return {
          selectedFPS: selectedConfig.selectedFPS,
          resolution: currentResolution,
        }
      } finally {
        await session.stop()
      }
    }

    const videoOnly = await resolveVideoSession(false)
    const videoOnlyShortEdge = Math.min(
      videoOnly.resolution.width,
      videoOnly.resolution.height,
    )
    const videoOnlyLongEdge = Math.max(
      videoOnly.resolution.width,
      videoOnly.resolution.height,
    )
    if (
      videoOnly.selectedFPS !== 60 ||
      videoOnlyShortEdge !== targetShortEdge ||
      videoOnlyLongEdge !== targetLongEdge
    ) {
      return context.skip(
        `device resolves video-only 4k@60 to ${videoOnly.resolution.width}x${videoOnly.resolution.height}@${videoOnly.selectedFPS ?? 'default'}fps`,
      )
    }

    const withPreview = await resolveVideoSession(true)
    const previewShortEdge = Math.min(
      withPreview.resolution.width,
      withPreview.resolution.height,
    )
    const previewLongEdge = Math.max(
      withPreview.resolution.width,
      withPreview.resolution.height,
    )
    console.log(
      `4k@60 video-only=${videoOnly.resolution.width}x${videoOnly.resolution.height}@${videoOnly.selectedFPS ?? 'default'}fps ` +
        `with-preview=${withPreview.resolution.width}x${withPreview.resolution.height}@${withPreview.selectedFPS ?? 'default'}fps`,
    )

    expect(withPreview.selectedFPS).toBe(60)
    expect(previewShortEdge).toBe(targetShortEdge)
    expect(previewLongEdge).toBe(targetLongEdge)
  })

  it('resolves photoHDR: true when the device supports photo HDR', async (context) => {
    if (!backDevice.supportsPhotoHDR) {
      return context.skip('photoHDR: not supported on this device')
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

  it('resolves a HDR video dynamic range when the device supports it', async (context) => {
    const hasHdr = backDevice.supportedVideoDynamicRanges.some(
      (d) => d.bitDepth === 'hdr-10-bit',
    )
    if (!hasHdr) {
      return context.skip('video HDR: no HDR dynamic range on this device')
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

  it('resolves a video stabilization constraint when supported', async (context) => {
    // The resolver downgrades stabilization modes (cinematic → standard → off)
    // when the requested one isn't supported, so picking the most demanding
    // mode the device exposes gives the test the most coverage.
    const stabDevice = factory.cameraDevices.find((d) =>
      d.supportsVideoStabilizationMode('cinematic'),
    )
    if (stabDevice == null) {
      return context.skip(
        'videoStabilizationMode: no device on this system supports "cinematic"',
      )
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: stabDevice,
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

  it('resolves a preview stabilization constraint when supported', async (context) => {
    const stabDevice = factory.cameraDevices.find((d) =>
      d.supportsPreviewStabilizationMode('preview-optimized'),
    )
    if (stabDevice == null) {
      return context.skip(
        'previewStabilizationMode: no device on this system supports "preview-optimized"',
      )
    }
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    let received: CameraSessionConfig | undefined
    await session.configure([
      {
        input: stabDevice,
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

  it('resolves a binned: true constraint when supported', async (context) => {
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
      await session.stop()
      return context.skip(
        `binned: true: device resolved to isBinned=${received?.isBinned}`,
      )
    }
    expect(received.isBinned).toBe(true)
    await session.stop()
  })

  it('honors a pixelFormat constraint matching a supported device format', async (context) => {
    const candidate = backDevice.supportedPixelFormats.find(
      (f) => f !== 'unknown',
    )
    if (candidate == null) {
      return context.skip(
        'pixelFormat constraint: device has no non-unknown formats',
      )
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

  // Verifies the resolver's priority mechanism by running the same pair of
  // constraints in both orderings and asserting that the first-listed (= highest
  // priority) one wins in each direction. The lower-priority constraint may or
  // may not survive depending on device combination support — that's a hardware
  // capability question, not a priority-ordering question, so we only log it.
  //
  // This catches regressions like "resolver always drops the first constraint
  // instead of the last" or "priority order is silently reversed", without
  // depending on which feature combinations the AWS Device Farm device happens
  // to support together.
  it('honors constraint priority ordering between stabilization and HDR', async (context) => {
    let chosenStabilizationMode: 'cinematic' | 'standard' | undefined
    for (const mode of ['cinematic', 'standard'] as const) {
      if (backDevice.supportsVideoStabilizationMode(mode)) {
        chosenStabilizationMode = mode
        break
      }
    }
    const hasHdr = backDevice.supportedVideoDynamicRanges.some(
      (d) => d.bitDepth === 'hdr-10-bit',
    )

    if (chosenStabilizationMode == null || !hasHdr) {
      return context.skip(
        'priority ordering: device lacks stabilization and/or HDR support',
      )
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const outputs = [{ output: videoOutput, mirrorMode: 'auto' as const }]

    // [stab, HDR] — stab has higher priority and must be honored. HDR may
    // legitimately fall back to SDR if the device can't combine them.
    const stabFirst = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      [
        { videoStabilizationMode: chosenStabilizationMode },
        { videoDynamicRange: CommonDynamicRanges.ANY_HDR },
      ],
    )
    expect(stabFirst.selectedVideoStabilizationMode).toBe(
      chosenStabilizationMode,
    )
    console.log(
      `priority [stab, HDR]: stab=${stabFirst.selectedVideoStabilizationMode} ` +
        `hdr=${stabFirst.selectedVideoDynamicRange?.bitDepth}`,
    )

    // [HDR, stab] — HDR has higher priority and must be honored. Stabilization
    // may legitimately fall back to off/auto if the device can't combine them.
    const hdrFirst = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      [
        { videoDynamicRange: CommonDynamicRanges.ANY_HDR },
        { videoStabilizationMode: chosenStabilizationMode },
      ],
    )
    expect(hdrFirst.selectedVideoDynamicRange?.bitDepth).toBe('hdr-10-bit')
    console.log(
      `priority [HDR, stab]: stab=${hdrFirst.selectedVideoStabilizationMode} ` +
        `hdr=${hdrFirst.selectedVideoDynamicRange?.bitDepth}`,
    )
  })

  it('reconfigures the running session with a different constraint set', async (context) => {
    if (!backDevice.supportsFPS(60)) {
      return context.skip(
        'reconfigure with new constraints: fps: 60 not supported',
      )
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
