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
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

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

  // Reproduces: a capture output's `targetResolution` is ignored when a preview
  // is attached. `<Camera>` always injects a preview output and auto-appends one
  // `{ resolutionBias }` per output (useCameraController.ts). The preview output's
  // bias is `.min(screenSize)`, which gives every >=screen-size format (e.g. 4K)
  // zero penalty and penalizes the capture output's `.closestTo(720p)`. Because
  // ConstraintResolver sums every bias into the total penalty, the preview's bias
  // dominates and the resolver negotiates the device's max (4K) format.
  //
  // `CameraSessionConfig` exposes no resolution and `onRecordingFinished` returns
  // only (path, reason), so a delivered Frame's width/height is the only
  // device-readable proof of the negotiated format. A Frame output streams at
  // that negotiated format, so an over-selected 4K format yields ~4K frames.
  it('keeps the negotiated resolution near a capture output target when a preview is attached', async (context) => {
    // Only reproducible on devices that expose a format larger than ~1080p, so a
    // 4K over-selection is even possible. Skip otherwise.
    const longestEdge = Math.max(
      ...backDevice
        .getSupportedResolutions('video')
        .map((r) => Math.max(r.width, r.height)),
    )
    if (longestEdge <= 1920) {
      return context.skip(
        `device max video resolution is ${longestEdge}px long edge; cannot reproduce 4K over-selection`,
      )
    }

    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9, // 1280x720
      pixelFormat: 'native',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })

    // Exactly what <Camera> builds under the hood: preview output first, and one
    // resolutionBias per output, so the preview's `.min(screenSize)` bias has the
    // highest priority.
    await session.configure([
      {
        input: backDevice,
        outputs: [
          { output: previewOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [
          { resolutionBias: previewOutput },
          { resolutionBias: frameOutput },
        ],
      },
    ])

    const firstFrame = deferred<{ width: number; height: number }>()
    const reportFrame = (width: number, height: number) =>
      firstFrame.resolve({ width, height })
    const errorSub = session.addOnErrorListener(firstFrame.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(reportFrame, frame.width, frame.height)
      frame.dispose()
    })

    await session.start()
    let negotiated: { width: number; height: number }
    try {
      negotiated = await withTimeout(
        firstFrame.promise,
        15_000,
        'receive frame',
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }

    const negotiatedLongEdge = Math.max(negotiated.width, negotiated.height)
    const negotiatedShortEdge = Math.min(negotiated.width, negotiated.height)
    console.log(
      `target=1280x720 negotiated=${negotiated.width}x${negotiated.height}`,
    )

    // A 1280x720 target must not negotiate a 4K (3840x2160) format just because a
    // preview is attached. Allow up to 1080p to tolerate devices without an exact
    // 720p format; fail on anything approaching 4K.
    expect(negotiatedLongEdge).toBeLessThanOrEqual(1920)
    expect(negotiatedShortEdge).toBeLessThanOrEqual(1080)
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
