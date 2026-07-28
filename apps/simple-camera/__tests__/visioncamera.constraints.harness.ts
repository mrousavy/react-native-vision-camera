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
  CameraOutputConfiguration,
  CameraSession,
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

  async function withStartedSession<T>(
    session: CameraSession,
    run: (throwIfSessionError: () => void) => Promise<T>,
  ): Promise<T> {
    let didStart = false
    let sessionError: Error | undefined
    const throwIfSessionError = () => {
      if (sessionError != null) throw sessionError
    }
    const startedSub = session.addOnStartedListener(() => {
      didStart = true
    })
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    try {
      await session.start()
      await waitUntil(
        () => {
          throwIfSessionError()
          return didStart
        },
        { timeout: 10_000 },
      )

      const result = await run(throwIfSessionError)
      throwIfSessionError()
      return result
    } finally {
      startedSub.remove()
      errorSub.remove()
    }
  }

  async function waitForOutputsToAttach(
    outputs: CameraOutputConfiguration[],
    throwIfSessionError: () => void,
  ) {
    await waitUntil(
      () => {
        throwIfSessionError()
        return outputs.every(({ output }) => output.currentResolution != null)
      },
      { timeout: 10_000 },
    )
  }

  function expectConfigsToMatch(
    sessionConfig: CameraSessionConfig,
    resolvedConfig: CameraSessionConfig,
  ) {
    expect(sessionConfig.selectedFPS).toBe(resolvedConfig.selectedFPS)
    expect(sessionConfig.selectedVideoStabilizationMode).toBe(
      resolvedConfig.selectedVideoStabilizationMode,
    )
    expect(sessionConfig.selectedPreviewStabilizationMode).toBe(
      resolvedConfig.selectedPreviewStabilizationMode,
    )
    expect(sessionConfig.selectedVideoDynamicRange).toEqual(
      resolvedConfig.selectedVideoDynamicRange,
    )
    expect(sessionConfig.isPhotoHDREnabled).toBe(
      resolvedConfig.isPhotoHDREnabled,
    )
    expect(sessionConfig.nativePixelFormat).toBe(
      resolvedConfig.nativePixelFormat,
    )
    expect(sessionConfig.autoFocusSystem).toBe(resolvedConfig.autoFocusSystem)
    expect(sessionConfig.isBinned).toBe(resolvedConfig.isBinned)
  }

  async function withRunningConstraintSession(
    device: CameraDevice,
    outputs: CameraOutputConfiguration[],
    constraints: Constraint[],
    assertConfig: (config: CameraSessionConfig) => void | Promise<void>,
    previouslyResolvedConfig?: CameraSessionConfig,
  ) {
    const resolvedConfig =
      previouslyResolvedConfig ??
      (await VisionCamera.resolveConstraints(device, outputs, constraints))
    const session = await VisionCamera.createCameraSession(false)
    let selectedConfig: CameraSessionConfig | undefined

    try {
      await session.configure([
        {
          input: device,
          outputs,
          constraints,
          onSessionConfigSelected: (config) => {
            selectedConfig = config
          },
        },
      ])
      await waitUntil(() => selectedConfig != null, { timeout: 5_000 })
      if (selectedConfig == null) throw new Error('no selected config')
      expectConfigsToMatch(selectedConfig, resolvedConfig)

      await withStartedSession(session, async (throwIfSessionError) => {
        await waitForOutputsToAttach(outputs, throwIfSessionError)
        if (selectedConfig == null) throw new Error('no selected config')
        await assertConfig(selectedConfig)
      })
    } finally {
      await session.stop()
    }
  }

  it('resolves a baseline config with no constraints', async () => {
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      backDevice,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [],
    )
    expect(backDevice.supportedPixelFormats).toContain(config.nativePixelFormat)
  })

  it('configures and starts an explicit fps: 30 constraint', async () => {
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    await withRunningConstraintSession(
      backDevice,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [{ fps: 30 }],
      (config) => {
        expect(config.selectedFPS).toBe(30)
      },
    )
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
      const outputs =
        previewOutput == null
          ? [{ output: videoOutput, mirrorMode: 'auto' as const }]
          : [
              { output: previewOutput, mirrorMode: 'auto' as const },
              { output: videoOutput, mirrorMode: 'auto' as const },
            ]
      const constraints: Constraint[] =
        previewOutput == null
          ? [{ fps: 60 }, { resolutionBias: videoOutput }]
          : [
              { fps: 60 },
              { resolutionBias: previewOutput },
              { resolutionBias: videoOutput },
            ]
      let selectedConfig: CameraSessionConfig | undefined

      try {
        await session.configure([
          {
            input: backDevice,
            outputs,
            constraints,
            onSessionConfigSelected: (config) => {
              selectedConfig = config
            },
          },
        ])
        await waitUntil(() => selectedConfig != null, { timeout: 5_000 })

        return await withStartedSession(
          session,
          async (throwIfSessionError) => {
            await waitForOutputsToAttach(outputs, throwIfSessionError)
            const currentResolution = videoOutput.currentResolution
            if (selectedConfig == null) throw new Error('no selected config')
            if (currentResolution == null)
              throw new Error('no video resolution')
            return {
              selectedFPS: selectedConfig.selectedFPS,
              resolution: currentResolution,
            }
          },
        )
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

    expect(withPreview.selectedFPS).toBe(60)
    expect(previewShortEdge).toBe(targetShortEdge)
    expect(previewLongEdge).toBe(targetLongEdge)
  })

  it('keeps a low video target when preview resolution bias is attached first', async (context) => {
    const targetResolution = CommonResolutions.HD_16_9
    const maxAllowedResolution = CommonResolutions.FHD_16_9
    const uhdResolution = CommonResolutions.UHD_16_9

    const getEdges = (resolution: { width: number; height: number }) => ({
      short: Math.min(resolution.width, resolution.height),
      long: Math.max(resolution.width, resolution.height),
    })

    const targetEdges = getEdges(targetResolution)
    const maxAllowedEdges = getEdges(maxAllowedResolution)
    const uhdEdges = getEdges(uhdResolution)
    const supportedVideoResolutions =
      backDevice.getSupportedResolutions('video')
    const supportsTargetResolution = supportedVideoResolutions.some(
      (resolution) => {
        const edges = getEdges(resolution)
        return (
          edges.short === targetEdges.short && edges.long === targetEdges.long
        )
      },
    )
    const supportsUhdResolution = supportedVideoResolutions.some(
      (resolution) => {
        const edges = getEdges(resolution)
        return edges.short === uhdEdges.short && edges.long === uhdEdges.long
      },
    )
    if (!supportsTargetResolution) {
      return context.skip('720p video resolution not supported on this device')
    }
    if (!supportsUhdResolution) {
      return context.skip('4k video resolution not supported on this device')
    }

    async function resolveLowTargetSession(includePreview: boolean) {
      const session = await VisionCamera.createCameraSession(false)
      const videoOutput = VisionCamera.createVideoOutput({
        targetResolution,
        enableAudio: false,
        enableHigherResolutionCodecs: true,
      })
      const previewOutput = includePreview
        ? VisionCamera.createPreviewOutput()
        : undefined
      const outputs =
        previewOutput == null
          ? [{ output: videoOutput, mirrorMode: 'auto' as const }]
          : [
              { output: previewOutput, mirrorMode: 'auto' as const },
              { output: videoOutput, mirrorMode: 'auto' as const },
            ]
      const constraints: Constraint[] =
        previewOutput == null
          ? [{ resolutionBias: videoOutput }]
          : [{ resolutionBias: previewOutput }, { resolutionBias: videoOutput }]

      try {
        await session.configure([
          {
            input: backDevice,
            outputs,
            constraints,
          },
        ])

        return await withStartedSession(
          session,
          async (throwIfSessionError) => {
            await waitForOutputsToAttach(outputs, throwIfSessionError)
            const currentResolution = videoOutput.currentResolution
            if (currentResolution == null)
              throw new Error('no video resolution')
            return currentResolution
          },
        )
      } finally {
        await session.stop()
      }
    }

    const videoOnly = await resolveLowTargetSession(false)
    const videoOnlyEdges = getEdges(videoOnly)
    if (
      videoOnlyEdges.short > maxAllowedEdges.short ||
      videoOnlyEdges.long > maxAllowedEdges.long
    ) {
      return context.skip(
        `device resolves video-only 720p target to ${videoOnly.width}x${videoOnly.height}`,
      )
    }

    const withPreview = await resolveLowTargetSession(true)
    const previewEdges = getEdges(withPreview)

    expect(previewEdges.short).toBeLessThanOrEqual(maxAllowedEdges.short)
    expect(previewEdges.long).toBeLessThanOrEqual(maxAllowedEdges.long)
  })

  // Regression test for https://github.com/mrousavy/react-native-vision-camera/issues/4073:
  // an explicitly listed resolutionBias for a recording output has a higher
  // priority than the auto-appended preview bias, so an app requesting
  // 1080p must record 1080p - not silently upgrade to 4k because the
  // preview prefers a >= screen-sized format.
  it('records the explicitly biased video resolution when a preview output is attached', async (context) => {
    const targetResolution = CommonResolutions.FHD_16_9
    const getEdges = (resolution: { width: number; height: number }) => ({
      short: Math.min(resolution.width, resolution.height),
      long: Math.max(resolution.width, resolution.height),
    })
    const targetEdges = getEdges(targetResolution)
    const supportsTargetResolution = backDevice
      .getSupportedResolutions('video')
      .some((resolution) => {
        const edges = getEdges(resolution)
        return (
          edges.short === targetEdges.short && edges.long === targetEdges.long
        )
      })
    if (!supportsTargetResolution) {
      return context.skip('1080p video resolution not supported on this device')
    }

    async function resolveExplicitBiasSession(includePreview: boolean) {
      const session = await VisionCamera.createCameraSession(false)
      const videoOutput = VisionCamera.createVideoOutput({
        targetResolution,
        enableAudio: false,
      })
      const previewOutput = includePreview
        ? VisionCamera.createPreviewOutput()
        : undefined
      const outputs =
        previewOutput == null
          ? [{ output: videoOutput, mirrorMode: 'auto' as const }]
          : [
              { output: previewOutput, mirrorMode: 'auto' as const },
              { output: videoOutput, mirrorMode: 'auto' as const },
            ]
      const constraints: Constraint[] =
        previewOutput == null
          ? [{ fps: 30 }, { resolutionBias: videoOutput }]
          : [
              { fps: 30 },
              { resolutionBias: videoOutput },
              { resolutionBias: previewOutput },
              { resolutionBias: videoOutput },
            ]
      let selectedConfig: CameraSessionConfig | undefined

      // The same constraints list `useCameraController` builds: the user's
      // explicit constraints first, then one auto-appended resolutionBias
      // per output (preview is listed as the first output by <Camera>).
      try {
        await session.configure([
          {
            input: backDevice,
            outputs,
            constraints,
            onSessionConfigSelected: (config) => {
              selectedConfig = config
            },
          },
        ])
        await waitUntil(() => selectedConfig != null, { timeout: 5_000 })

        return await withStartedSession(
          session,
          async (throwIfSessionError) => {
            await waitForOutputsToAttach(outputs, throwIfSessionError)
            const currentResolution = videoOutput.currentResolution
            if (selectedConfig == null) throw new Error('no selected config')
            if (currentResolution == null)
              throw new Error('no video resolution')
            return {
              selectedFPS: selectedConfig.selectedFPS,
              resolution: currentResolution,
            }
          },
        )
      } finally {
        await session.stop()
      }
    }

    const videoOnly = await resolveExplicitBiasSession(false)
    const videoOnlyEdges = getEdges(videoOnly.resolution)
    if (
      videoOnly.selectedFPS !== 30 ||
      videoOnlyEdges.short !== targetEdges.short ||
      videoOnlyEdges.long !== targetEdges.long
    ) {
      return context.skip(
        `device resolves video-only 1080p@30 to ${videoOnly.resolution.width}x${videoOnly.resolution.height}@${videoOnly.selectedFPS ?? 'default'}fps`,
      )
    }

    const withPreview = await resolveExplicitBiasSession(true)
    const withPreviewEdges = getEdges(withPreview.resolution)

    expect(withPreview.selectedFPS).toBe(30)
    expect(withPreviewEdges.short).toBe(targetEdges.short)
    expect(withPreviewEdges.long).toBe(targetEdges.long)
  })

  it('keeps the photo target resolution when a preview output is attached', async () => {
    const getEdges = (resolution: { width: number; height: number }) => ({
      short: Math.min(resolution.width, resolution.height),
      long: Math.max(resolution.width, resolution.height),
    })

    async function resolvePhotoSession(includePreview: boolean) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.UHD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      const previewOutput = includePreview
        ? VisionCamera.createPreviewOutput()
        : undefined
      const outputs =
        previewOutput == null
          ? [{ output: photoOutput, mirrorMode: 'auto' as const }]
          : [
              { output: previewOutput, mirrorMode: 'auto' as const },
              { output: photoOutput, mirrorMode: 'auto' as const },
            ]
      const constraints: Constraint[] =
        previewOutput == null
          ? [{ resolutionBias: photoOutput }]
          : [{ resolutionBias: photoOutput }, { resolutionBias: previewOutput }]

      try {
        await session.configure([
          {
            input: backDevice,
            outputs,
            constraints,
          },
        ])

        return await withStartedSession(
          session,
          async (throwIfSessionError) => {
            await waitForOutputsToAttach(outputs, throwIfSessionError)
            const currentResolution = photoOutput.currentResolution
            if (currentResolution == null)
              throw new Error('no photo resolution')
            return currentResolution
          },
        )
      } finally {
        await session.stop()
      }
    }

    const photoOnly = await resolvePhotoSession(false)
    const withPreview = await resolvePhotoSession(true)
    const photoOnlyEdges = getEdges(photoOnly)
    const withPreviewEdges = getEdges(withPreview)

    expect(withPreviewEdges.short).toBe(photoOnlyEdges.short)
    expect(withPreviewEdges.long).toBe(photoOnlyEdges.long)
  })

  it('configures and starts photoHDR: true when supported', async (context) => {
    if (!backDevice.supportsPhotoHDR) {
      return context.skip('photoHDR: not supported on this device')
    }
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const outputs = [{ output: photoOutput, mirrorMode: 'auto' as const }]
    const constraints: Constraint[] = [
      { resolutionBias: photoOutput },
      { photoHDR: true },
    ]
    const resolvedConfig = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      constraints,
    )
    if (!resolvedConfig.isPhotoHDREnabled) {
      return context.skip('photoHDR: exact output graph resolves without HDR')
    }
    await withRunningConstraintSession(
      backDevice,
      outputs,
      constraints,
      (config) => {
        expect(config.isPhotoHDREnabled).toBe(true)
      },
      resolvedConfig,
    )
  })

  it('configures and starts an HDR video dynamic range when supported', async (context) => {
    const hasHdr = backDevice.supportedVideoDynamicRanges.some(
      (d) => d.bitDepth === 'hdr-10-bit',
    )
    if (!hasHdr) {
      return context.skip('video HDR: no HDR dynamic range on this device')
    }
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const outputs = [{ output: videoOutput, mirrorMode: 'auto' as const }]
    const constraints: Constraint[] = [
      { videoDynamicRange: CommonDynamicRanges.ANY_HDR },
      { resolutionBias: videoOutput },
    ]
    const resolvedConfig = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      constraints,
    )
    if (resolvedConfig.selectedVideoDynamicRange?.bitDepth !== 'hdr-10-bit') {
      return context.skip(
        'video HDR: exact output graph resolves without an HDR dynamic range',
      )
    }
    await withRunningConstraintSession(
      backDevice,
      outputs,
      constraints,
      (config) => {
        expect(config.selectedVideoDynamicRange?.bitDepth).toBe('hdr-10-bit')
      },
      resolvedConfig,
    )
  })

  it('configures and starts a video stabilization constraint when supported', async (context) => {
    const modes = [
      'cinematic-extended-enhanced',
      'cinematic-extended',
      'cinematic',
      'standard',
      'low-latency',
    ] as const
    let selection:
      | {
          device: CameraDevice
          mode: (typeof modes)[number]
        }
      | undefined
    for (const mode of modes) {
      const device = factory.cameraDevices.find((candidate) =>
        candidate.supportsVideoStabilizationMode(mode),
      )
      if (device != null) {
        selection = { device, mode }
        break
      }
    }
    if (selection == null) {
      return context.skip(
        'videoStabilizationMode: no device supports an explicit mode',
      )
    }
    const { device, mode } = selection
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const outputs = [{ output: videoOutput, mirrorMode: 'auto' as const }]
    const constraints: Constraint[] = [{ videoStabilizationMode: mode }]
    const resolvedConfig = await VisionCamera.resolveConstraints(
      device,
      outputs,
      constraints,
    )
    if (resolvedConfig.selectedVideoStabilizationMode !== mode) {
      return context.skip(
        `videoStabilizationMode: graph resolves ${mode} to ${resolvedConfig.selectedVideoStabilizationMode ?? 'default'}`,
      )
    }
    await withRunningConstraintSession(
      device,
      outputs,
      constraints,
      (config) => {
        expect(config.selectedVideoStabilizationMode).toBe(mode)
      },
      resolvedConfig,
    )
  })

  it('configures and starts a preview stabilization constraint when supported', async (context) => {
    const modes = [
      'preview-optimized',
      'cinematic-extended-enhanced',
      'cinematic-extended',
      'cinematic',
      'standard',
      'low-latency',
    ] as const
    let selection:
      | {
          device: CameraDevice
          mode: (typeof modes)[number]
        }
      | undefined
    for (const mode of modes) {
      const device = factory.cameraDevices.find((candidate) =>
        candidate.supportsPreviewStabilizationMode(mode),
      )
      if (device != null) {
        selection = { device, mode }
        break
      }
    }
    if (selection == null) {
      return context.skip(
        'previewStabilizationMode: no device supports an explicit mode',
      )
    }
    const { device, mode } = selection
    const previewOutput = VisionCamera.createPreviewOutput()
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const outputs = [
      { output: previewOutput, mirrorMode: 'auto' as const },
      { output: photoOutput, mirrorMode: 'auto' as const },
    ]
    const constraints: Constraint[] = [
      { previewStabilizationMode: mode },
      { resolutionBias: photoOutput },
    ]
    const resolvedConfig = await VisionCamera.resolveConstraints(
      device,
      outputs,
      constraints,
    )
    if (resolvedConfig.selectedPreviewStabilizationMode !== mode) {
      return context.skip(
        `previewStabilizationMode: graph resolves ${mode} to ${resolvedConfig.selectedPreviewStabilizationMode ?? 'default'}`,
      )
    }
    await withRunningConstraintSession(
      device,
      outputs,
      constraints,
      (config) => {
        expect(config.selectedPreviewStabilizationMode).toBe(mode)
      },
      resolvedConfig,
    )
  })

  it('configures and starts binned: true when supported', async (context) => {
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const outputs = [{ output: photoOutput, mirrorMode: 'auto' as const }]
    const constraints: Constraint[] = [{ binned: true }]
    const resolvedConfig = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      constraints,
    )
    if (resolvedConfig.isBinned !== true) {
      return context.skip(
        `binned: true: device resolved to isBinned=${resolvedConfig.isBinned}`,
      )
    }
    await withRunningConstraintSession(
      backDevice,
      outputs,
      constraints,
      (config) => {
        expect(config.isBinned).toBe(true)
      },
      resolvedConfig,
    )
  })

  // Verifies the resolver's priority mechanism by running the same pair of
  // constraints in both orderings and asserting that the first-listed (= highest
  // priority) one wins in each direction. The lower-priority constraint may or
  // may not survive depending on device combination support — that's a hardware
  // capability question, not a priority-ordering question, so it is not asserted.
  //
  // This catches regressions like "resolver always drops the first constraint
  // instead of the last" or "priority order is silently reversed", without
  // depending on which feature combinations the AWS Device Farm device happens
  // to support together. This stays resolver-only because the individual HDR
  // and stabilization constraints above already cross-check a running session.
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
  })

  it('reconfigures the running session with a different constraint set', async (context) => {
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const outputs = [{ output: videoOutput, mirrorMode: 'auto' as const }]
    const firstConstraints: Constraint[] = [{ fps: 30 }]
    const secondConstraints: Constraint[] = [{ fps: 60 }]
    const firstResolvedConfig = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      firstConstraints,
    )
    const secondResolvedConfig = await VisionCamera.resolveConstraints(
      backDevice,
      outputs,
      secondConstraints,
    )
    if (
      firstResolvedConfig.selectedFPS !== 30 ||
      secondResolvedConfig.selectedFPS !== 60
    ) {
      return context.skip(
        `graph resolves 30→60 fps to ${firstResolvedConfig.selectedFPS ?? 'default'}→${secondResolvedConfig.selectedFPS ?? 'default'} fps`,
      )
    }

    const session = await VisionCamera.createCameraSession(false)
    let firstConfig: CameraSessionConfig | undefined
    try {
      await session.configure([
        {
          input: backDevice,
          outputs,
          constraints: firstConstraints,
          onSessionConfigSelected: (config) => {
            firstConfig = config
          },
        },
      ])
      await waitUntil(() => firstConfig != null, { timeout: 5_000 })
      if (firstConfig == null) throw new Error('no first selected config')
      expectConfigsToMatch(firstConfig, firstResolvedConfig)
      expect(firstConfig.selectedFPS).toBe(30)

      await withStartedSession(session, async (throwIfSessionError) => {
        await waitForOutputsToAttach(outputs, throwIfSessionError)

        let secondConfig: CameraSessionConfig | undefined
        await session.configure([
          {
            input: backDevice,
            outputs,
            constraints: secondConstraints,
            onSessionConfigSelected: (config) => {
              secondConfig = config
            },
          },
        ])
        await waitUntil(
          () => {
            throwIfSessionError()
            return secondConfig != null
          },
          { timeout: 5_000 },
        )
        if (secondConfig == null) throw new Error('no second selected config')
        expectConfigsToMatch(secondConfig, secondResolvedConfig)
        expect(secondConfig.selectedFPS).toBe(60)

        await waitUntil(
          () => {
            throwIfSessionError()
            return session.isRunning
          },
          { timeout: 10_000 },
        )
      })
    } finally {
      await session.stop()
    }
  })
})
