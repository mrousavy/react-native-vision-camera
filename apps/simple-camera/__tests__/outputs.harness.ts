import { Platform } from 'react-native'
import { beforeAll, describe, expect, it } from 'react-native-harness'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - CameraPreviewOutput', () => {
  beforeAll(async () => {
    const granted = await VisionCamera.requestCameraPermission()
    if (!granted) {
      throw new Error(
        'Camera permission was not granted. Output tests require camera permission.',
      )
    }
  })

  it('creates a new CameraPreviewOutput', () => {
    const output = VisionCamera.createPreviewOutput()

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
  })

  it('creates distinct instances on each call', () => {
    const firstOutput = VisionCamera.createPreviewOutput()
    const secondOutput = VisionCamera.createPreviewOutput()

    expect(firstOutput).not.toBe(secondOutput)
  })
})

describe('VisionCamera - CameraPhotoOutput', () => {
  it('creates a new CameraPhotoOutput with balanced quality prioritization', () => {
    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
    expect(typeof output.supportsDepthDataDelivery).toBe('boolean')
    expect(typeof output.supportsCameraCalibrationDataDelivery).toBe('boolean')
  })

  it('creates a CameraPhotoOutput with quality prioritization', () => {
    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'jpeg',
      quality: 1.0,
      qualityPrioritization: 'quality',
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
  })

  it('creates a CameraPhotoOutput with speed prioritization and a preview image target size', () => {
    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'speed',
      previewImageTargetSize: { width: 128, height: 128 },
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
  })

  it('creates a JPEG CameraPhotoOutput', () => {
    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'jpeg',
      quality: 0.85,
      qualityPrioritization: 'balanced',
    })

    expect(output).toBeDefined()
  })

  it('creates a HEIC CameraPhotoOutput on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] HEIC CameraPhotoOutput: iOS only')
      return
    }

    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'heic',
      quality: 0.85,
      qualityPrioritization: 'balanced',
    })

    expect(output).toBeDefined()
  })

  it('creates a DNG (RAW) CameraPhotoOutput', () => {
    const output = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'dng',
      quality: 1,
      qualityPrioritization: 'quality',
    })

    expect(output).toBeDefined()
  })
})

describe('VisionCamera - CameraVideoOutput', () => {
  it('creates a new CameraVideoOutput with default options', () => {
    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
    expect(typeof output.createRecorder).toBe('function')
  })

  it('creates a CameraVideoOutput with audio enabled', () => {
    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: true,
      enablePersistentRecorder: false,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraVideoOutput with a persistent recorder', () => {
    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraVideoOutput with a target bit rate', () => {
    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
      targetBitRate: 8_000_000,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraVideoOutput with higher resolution codecs enabled on Android', () => {
    if (Platform.OS !== 'android') {
      console.log(
        '[SKIP] enableHigherResolutionCodecs: only applies on Android',
      )
      return
    }

    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
      enableHigherResolutionCodecs: true,
    })

    expect(output).toBeDefined()
  })

  it('throws when calling getSupportedVideoCodecs before attaching to a session on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] getSupportedVideoCodecs: iOS only')
      return
    }

    const output = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })

    let threw = false
    try {
      output.getSupportedVideoCodecs()
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
  })
})

describe('VisionCamera - CameraFrameOutput', () => {
  it('creates a CameraFrameOutput with native pixel format', () => {
    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('video')
    expect(output.thread).toBeDefined()
  })

  it('creates a CameraFrameOutput with yuv pixel format and preview-sized buffers', () => {
    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraFrameOutput with rgb pixel format and no frame dropping', () => {
    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'rgb',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraFrameOutput with physical buffer rotation enabled', () => {
    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: true,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraFrameOutput with deferred start on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraFrameOutput allowDeferredStart: iOS only')
      return
    }

    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: true,
    })

    expect(output).toBeDefined()
  })

  it('creates a CameraFrameOutput with camera matrix delivery on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log(
        '[SKIP] CameraFrameOutput enableCameraMatrixDelivery: iOS only',
      )
      return
    }

    const output = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: true,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
  })
})

describe('VisionCamera - CameraDepthFrameOutput', () => {
  it('creates a CameraDepthFrameOutput with filtering enabled', () => {
    const output = VisionCamera.createDepthFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableFiltering: true,
      enablePhysicalBufferRotation: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('depth')
    expect(output.thread).toBeDefined()
  })

  it('creates a CameraDepthFrameOutput with filtering disabled and physical buffer rotation', () => {
    const output = VisionCamera.createDepthFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableFiltering: false,
      enablePhysicalBufferRotation: true,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })

    expect(output).toBeDefined()
  })
})

describe('VisionCamera - CameraObjectOutput', () => {
  it('creates a CameraObjectOutput for machine-readable codes on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraObjectOutput: iOS only')
      return
    }

    const output = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['qr', 'ean-13', 'pdf-417', 'code-128'],
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('metadata')
    expect(typeof output.setOnObjectsScannedCallback).toBe('function')
  })

  it('creates a CameraObjectOutput for face and human-body detection on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraObjectOutput: iOS only')
      return
    }

    const output = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['face', 'human-body', 'human-full-body'],
    })

    expect(output).toBeDefined()
    expect(output.mediaType).toBe('metadata')
  })

  it('creates a CameraObjectOutput for animals on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraObjectOutput: iOS only')
      return
    }

    const output = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['dog-head', 'dog-body', 'cat-head', 'cat-body'],
    })

    expect(output).toBeDefined()
  })

  it('allows clearing the object scanned callback', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraObjectOutput: iOS only')
      return
    }

    const output = VisionCamera.createObjectOutput({
      enabledObjectTypes: ['qr'],
    })

    output.setOnObjectsScannedCallback(undefined)
    expect(output).toBeDefined()
  })
})

describe('VisionCamera - CameraOutputSynchronizer', () => {
  it('creates a CameraOutputSynchronizer from two outputs on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] CameraOutputSynchronizer: iOS only')
      return
    }

    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })
    const depthOutput = VisionCamera.createDepthFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
      enableFiltering: true,
      enablePhysicalBufferRotation: false,
      dropFramesWhileBusy: false,
      allowDeferredStart: false,
    })

    const synchronizer = VisionCamera.createOutputSynchronizer([
      frameOutput,
      depthOutput,
    ])

    expect(synchronizer).toBeDefined()
    expect(synchronizer.outputs.length).toBe(2)
    expect(synchronizer.thread).toBeDefined()
  })
})

describe('VisionCamera - Output targetResolution variations', () => {
  it('accepts all CommonResolutions for photo outputs', () => {
    const keys = Object.keys(
      CommonResolutions,
    ) as (keyof typeof CommonResolutions)[]
    for (const key of keys) {
      const resolution = CommonResolutions[key]
      const output = VisionCamera.createPhotoOutput({
        targetResolution: resolution,
        containerFormat: 'native',
        quality: 0.9,
        qualityPrioritization: 'balanced',
      })
      expect(output).toBeDefined()
    }
  })

  it('accepts all CommonResolutions for video outputs', () => {
    const keys = Object.keys(
      CommonResolutions,
    ) as (keyof typeof CommonResolutions)[]
    for (const key of keys) {
      const resolution = CommonResolutions[key]
      const output = VisionCamera.createVideoOutput({
        targetResolution: resolution,
        enableAudio: false,
        enablePersistentRecorder: false,
      })
      expect(output).toBeDefined()
    }
  })

  it('accepts a custom targetResolution on all stream-based outputs', () => {
    const custom = { width: 640, height: 480 }
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: custom,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: custom,
      enableAudio: false,
      enablePersistentRecorder: false,
    })
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: custom,
      enablePreviewSizedOutputBuffers: false,
      pixelFormat: 'native',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })
    const depthOutput = VisionCamera.createDepthFrameOutput({
      targetResolution: custom,
      enableFiltering: false,
      enablePhysicalBufferRotation: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    expect(photoOutput).toBeDefined()
    expect(videoOutput).toBeDefined()
    expect(frameOutput).toBeDefined()
    expect(depthOutput).toBeDefined()
  })
})
