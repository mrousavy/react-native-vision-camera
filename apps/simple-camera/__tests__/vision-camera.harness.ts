import { Platform } from 'react-native'
import { describe, expect, it } from 'react-native-harness'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera Harness - Imperative creation APIs', () => {
  it('creates single-cam and (when supported) multi-cam sessions', async () => {
    const singleCamSession = await VisionCamera.createCameraSession(false)

    expect(singleCamSession).toBeDefined()
    expect(singleCamSession.isRunning).toBe(false)

    if (!VisionCamera.supportsMultiCamSessions) {
      expect(VisionCamera.supportsMultiCamSessions).toBe(false)
      return
    }

    const multiCamSession = await VisionCamera.createCameraSession(true)

    expect(multiCamSession).toBeDefined()
    expect(multiCamSession.isRunning).toBe(false)
  })

  it('discovers devices from the device factory', async () => {
    const deviceFactory = await VisionCamera.createDeviceFactory()

    expect(deviceFactory).toBeDefined()
    expect(Array.isArray(deviceFactory.cameraDevices)).toBe(true)

    for (const device of deviceFactory.cameraDevices) {
      const lookedUpDevice = deviceFactory.getCameraForId(device.id)

      if (lookedUpDevice == null) {
        continue
      }

      expect(
        deviceFactory.cameraDevices.some((d) => d.id === lookedUpDevice.id),
      ).toBe(true)
    }

    const backCamera = deviceFactory.getDefaultCamera('back')
    const frontCamera = deviceFactory.getDefaultCamera('front')

    if (backCamera != null) {
      expect(backCamera.position).toBe('back')
    }
    if (frontCamera != null) {
      expect(frontCamera.position).toBe('front')
    }
  })

  it('creates preview outputs repeatedly', () => {
    const firstPreviewOutput = VisionCamera.createPreviewOutput()
    const secondPreviewOutput = VisionCamera.createPreviewOutput()

    expect(firstPreviewOutput.outputType).toBe('preview')
    expect(secondPreviewOutput.outputType).toBe('preview')
    expect(firstPreviewOutput).not.toBe(secondPreviewOutput)
  })

  it('creates photo outputs with different option combinations', () => {
    const defaultLikePhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    const qualityPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'jpeg',
      quality: 1,
      qualityPrioritization: 'quality',
    })
    const speedPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'speed',
      previewImageTargetSize: { width: 128, height: 128 },
    })

    expect(defaultLikePhotoOutput.outputType).toBe('photo')
    expect(qualityPhotoOutput.outputType).toBe('photo')
    expect(speedPhotoOutput.outputType).toBe('photo')
  })

  it('validates photo output quality range', () => {
    let error: unknown

    try {
      VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.UHD_4_3,
        containerFormat: 'native',
        quality: 1.1,
        qualityPrioritization: 'balanced',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeDefined()
  })

  it('creates video outputs with different option combinations', () => {
    const simpleVideoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })
    const persistentVideoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
      targetBitRate: 5_000_000,
    })

    expect(simpleVideoOutput.outputType).toBe('video')
    expect(persistentVideoOutput.outputType).toBe('video')
  })

  it('creates frame outputs with different option combinations', () => {
    const yuvFrameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: true,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })
    const rgbFrameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'rgb',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })
    const nativeFrameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(yuvFrameOutput.outputType).toBe('stream')
    expect(rgbFrameOutput.outputType).toBe('stream')
    expect(nativeFrameOutput.outputType).toBe('stream')
  })

  it('creates depth outputs with different option combinations', () => {
    const filteredDepthOutput = VisionCamera.createDepthFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableFiltering: true,
      enablePhysicalBufferRotation: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })
    const unfilteredDepthOutput = VisionCamera.createDepthFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableFiltering: false,
      enablePhysicalBufferRotation: true,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })

    expect(filteredDepthOutput.outputType).toBe('stream')
    expect(unfilteredDepthOutput.outputType).toBe('stream')
  })

  it('creates object outputs on iOS', () => {
    if (Platform.OS !== 'ios') {
      expect(Platform.OS).not.toBe('ios')
      return
    }

    const codeObjectOutput = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['qr', 'ean-13', 'pdf-417'],
    })
    const mixedObjectOutput = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['face', 'human-body'],
    })

    expect(codeObjectOutput.outputType).toBe('stream')
    expect(mixedObjectOutput.outputType).toBe('stream')
  })

  it('configures and starts a runtime session with photo output', async () => {
    if (VisionCamera.cameraPermissionStatus !== 'authorized') {
      expect(VisionCamera.cameraPermissionStatus).not.toBe('authorized')
      return
    }

    const deviceFactory = await VisionCamera.createDeviceFactory()
    const input =
      deviceFactory.getDefaultCamera('back') ??
      deviceFactory.getDefaultCamera('front') ??
      deviceFactory.cameraDevices[0]

    if (input == null) {
      expect(deviceFactory.cameraDevices.length).toBe(0)
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)
    await session.start()
    expect(session.isRunning).toBe(true)
    await session.stop()
    expect(session.isRunning).toBe(false)
  })

  it('configures runtime session with photo + video + frame outputs', async () => {
    if (VisionCamera.cameraPermissionStatus !== 'authorized') {
      expect(VisionCamera.cameraPermissionStatus).not.toBe('authorized')
      return
    }

    const deviceFactory = await VisionCamera.createDeviceFactory()
    const input =
      deviceFactory.getDefaultCamera('back') ??
      deviceFactory.getDefaultCamera('front') ??
      deviceFactory.cameraDevices[0]

    if (input == null) {
      expect(deviceFactory.cameraDevices.length).toBe(0)
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.85,
      qualityPrioritization: 'quality',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })

    const controllers = await session.configure([
      {
        input,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
        initialZoom: 1,
        initialExposureBias: 0,
      },
    ])

    expect(controllers.length).toBe(1)
  })
})
