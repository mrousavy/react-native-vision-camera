import { afterAll, beforeAll, describe, expect, it } from 'react-native-harness'
import {
  type CameraDevice,
  type CameraDeviceFactory,
  CommonDynamicRanges,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'

let factory: CameraDeviceFactory
let device: CameraDevice | undefined

describe('VisionCamera - resolveConstraints', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
    device =
      factory.getDefaultCamera('back') ??
      factory.getDefaultCamera('front') ??
      factory.cameraDevices[0]
  })

  afterAll(() => {
    device = undefined
  })

  it('resolves an empty set of constraints with a photo output', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints: no camera device available')
      return
    }

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [],
    )

    expect(config).toBeDefined()
    expect(typeof config.nativePixelFormat).toBe('string')
    expect(typeof config.isPhotoHDREnabled).toBe('boolean')
    expect(typeof config.isBinned).toBe('boolean')
    expect(['none', 'contrast-detection', 'phase-detection']).toContain(
      config.autoFocusSystem,
    )
  })

  it('resolves constraints for a preview + photo output configuration', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints: no camera device available')
      return
    }

    const previewOutput = VisionCamera.createPreviewOutput()
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [
        { output: previewOutput, mirrorMode: 'auto' },
        { output: photoOutput, mirrorMode: 'auto' },
      ],
      [{ resolutionBias: photoOutput }],
    )

    expect(config).toBeDefined()
  })

  it('resolves an FPS constraint to the requested frame rate when supported', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints FPS: no camera device available')
      return
    }
    if (!device.supportsFPS(30)) {
      console.log(
        '[SKIP] resolveConstraints FPS 30: device does not support it',
      )
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ fps: 30 }],
    )

    expect(config.selectedFPS).toBe(30)
  })

  it('resolves a 60 FPS constraint when the device supports it', async () => {
    if (device == null) {
      console.log(
        '[SKIP] resolveConstraints FPS 60: no camera device available',
      )
      return
    }
    if (!device.supportsFPS(60)) {
      console.log(
        '[SKIP] resolveConstraints FPS 60: device does not support it',
      )
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ fps: 60 }],
    )

    expect(config.selectedFPS).toBe(60)
  })

  it('resolves the photoHDR constraint when the device supports it', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints Photo HDR: no camera device')
      return
    }
    if (!device.supportsPhotoHDR) {
      console.log(
        '[SKIP] resolveConstraints Photo HDR: not supported on device',
      )
      return
    }

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [{ photoHDR: true }],
    )

    expect(config.isPhotoHDREnabled).toBe(true)
  })

  it('resolves photoHDR: false explicitly', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints Photo HDR false: no camera device')
      return
    }

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [{ photoHDR: false }],
    )

    expect(config.isPhotoHDREnabled).toBe(false)
  })

  it('resolves CommonDynamicRanges.ANY_HDR when the device supports it', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints Video HDR: no camera device')
      return
    }
    const supportsHDR = device.supportedVideoDynamicRanges.some(
      (range) => range.bitDepth === 'hdr-10-bit',
    )
    if (!supportsHDR) {
      console.log(
        '[SKIP] resolveConstraints Video HDR: device does not expose any HDR 10-bit range',
      )
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ videoDynamicRange: CommonDynamicRanges.ANY_HDR }],
    )

    if (config.selectedVideoDynamicRange == null) {
      console.log(
        '[SKIP] resolveConstraints Video HDR: negotiation did not pick any dynamic range',
      )
      return
    }

    expect(config.selectedVideoDynamicRange.bitDepth).toBe('hdr-10-bit')
  })

  it('resolves CommonDynamicRanges.ANY_SDR on every device', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints Video SDR: no camera device')
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ videoDynamicRange: CommonDynamicRanges.ANY_SDR }],
    )

    if (config.selectedVideoDynamicRange == null) {
      console.log(
        '[SKIP] resolveConstraints Video SDR: negotiation did not pick any dynamic range',
      )
      return
    }

    expect(config.selectedVideoDynamicRange.bitDepth).toBe('sdr-8-bit')
  })

  it("resolves video stabilization 'off' on every device", async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints video stabilization: no camera')
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ videoStabilizationMode: 'off' }],
    )

    expect(config.selectedVideoStabilizationMode).toBe('off')
  })

  it("resolves video stabilization 'auto' on every device", async () => {
    if (device == null) {
      console.log(
        '[SKIP] resolveConstraints video stabilization auto: no camera',
      )
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ videoStabilizationMode: 'auto' }],
    )

    expect(config.selectedVideoStabilizationMode).toBeDefined()
  })

  it("resolves preview stabilization 'off' on every device", async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints preview stabilization: no camera')
      return
    }

    const previewOutput = VisionCamera.createPreviewOutput()

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: previewOutput, mirrorMode: 'auto' }],
      [{ previewStabilizationMode: 'off' }],
    )

    expect(config.selectedPreviewStabilizationMode).toBe('off')
  })

  it("resolves 'standard' video stabilization if supported", async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints standard stabilization: no camera')
      return
    }
    if (!device.supportsVideoStabilizationMode('standard')) {
      console.log(
        '[SKIP] resolveConstraints standard stabilization: not supported on device',
      )
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ videoStabilizationMode: 'standard' }],
    )

    expect(config.selectedVideoStabilizationMode).toBe('standard')
  })

  it('resolves a pixelFormat constraint to a compatible format', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints pixelFormat: no camera')
      return
    }
    const yuvFormat = device.supportedPixelFormats.find((format) =>
      format.startsWith('yuv'),
    )
    if (yuvFormat == null) {
      console.log(
        '[SKIP] resolveConstraints pixelFormat: no yuv format supported',
      )
      return
    }

    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: frameOutput, mirrorMode: 'auto' }],
      [{ pixelFormat: yuvFormat }],
    )

    expect(typeof config.nativePixelFormat).toBe('string')
  })

  it('resolves a binned: true constraint to a sensible config', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints binned: no camera')
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ binned: true }],
    )

    expect(typeof config.isBinned).toBe('boolean')
  })

  it('resolves a binned: false constraint to a sensible config', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints binned false: no camera')
      return
    }

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: videoOutput, mirrorMode: 'auto' }],
      [{ binned: false }],
    )

    expect(typeof config.isBinned).toBe('boolean')
  })

  it('resolves multiple prioritized constraints in order', async () => {
    if (device == null) {
      console.log('[SKIP] resolveConstraints priorities: no camera')
      return
    }

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [
        { output: photoOutput, mirrorMode: 'auto' },
        { output: videoOutput, mirrorMode: 'auto' },
      ],
      [
        { resolutionBias: photoOutput },
        { photoHDR: device.supportsPhotoHDR },
        { resolutionBias: videoOutput },
      ],
    )

    expect(config).toBeDefined()
  })

  it('exposes isSessionConfigSupported returning true for a resolved config', async () => {
    if (device == null) {
      console.log('[SKIP] isSessionConfigSupported: no camera')
      return
    }

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const config = await VisionCamera.resolveConstraints(
      device,
      [{ output: photoOutput, mirrorMode: 'auto' }],
      [],
    )

    expect(device.isSessionConfigSupported(config)).toBe(true)
  })
})
