import { Platform } from 'react-native'
import { beforeAll, describe, expect, it } from 'react-native-harness'
import {
  type CameraDeviceFactory,
  VisionCamera,
} from 'react-native-vision-camera'

const VALID_POSITIONS = ['front', 'back', 'external', 'unspecified'] as const
const VALID_DEVICE_TYPES = [
  'wide-angle',
  'ultra-wide-angle',
  'telephoto',
  'dual',
  'dual-wide',
  'triple',
  'quad',
  'continuity',
  'lidar-depth',
  'true-depth',
  'time-of-flight-depth',
  'external',
  'unknown',
] as const
const VALID_MEDIA_TYPES = ['video', 'depth', 'metadata', 'other'] as const
const VALID_OUTPUT_STREAM_TYPES = [
  'photo',
  'video',
  'stream',
  'depth-photo',
  'depth-stream',
] as const

let factory: CameraDeviceFactory

describe('VisionCamera - CameraDeviceFactory', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('creates a new CameraDeviceFactory', async () => {
    const anotherFactory = await VisionCamera.createDeviceFactory()

    expect(anotherFactory).toBeDefined()
    expect(Array.isArray(anotherFactory.cameraDevices)).toBe(true)
  })

  it('exposes a cameraDevices array', () => {
    expect(Array.isArray(factory.cameraDevices)).toBe(true)
  })

  it('has at least one camera device (hard requirement)', () => {
    if (factory.cameraDevices.length === 0) {
      throw new Error(
        'Expected the device to expose at least one CameraDevice, but got none.',
      )
    }

    expect(factory.cameraDevices.length).toBeGreaterThan(0)
  })

  it('has at least a back- or front-facing default camera (hard requirement)', () => {
    const back = factory.getDefaultCamera('back')
    const front = factory.getDefaultCamera('front')

    if (back == null && front == null) {
      throw new Error(
        'Expected the device to expose at least a back- or front-facing default camera, but got neither.',
      )
    }

    expect(back != null || front != null).toBe(true)
  })

  it("gets the default 'back' camera if available", () => {
    const back = factory.getDefaultCamera('back')

    if (back == null) {
      console.log('[SKIP] default back camera: not available on this device')
      return
    }

    expect(back.position).toBe('back')
  })

  it("gets the default 'front' camera if available", () => {
    const front = factory.getDefaultCamera('front')

    if (front == null) {
      console.log('[SKIP] default front camera: not available on this device')
      return
    }

    expect(front.position).toBe('front')
  })

  it('looks up each camera device by its unique id', () => {
    for (const device of factory.cameraDevices) {
      const lookedUp = factory.getCameraForId(device.id)

      expect(lookedUp).toBeDefined()
      expect(lookedUp?.id).toBe(device.id)
    }
  })

  it('returns undefined when looking up an unknown id', () => {
    const lookedUp = factory.getCameraForId(
      'definitely-not-a-real-camera-id-xyzzy',
    )

    expect(lookedUp).toBe(undefined)
  })

  it('exposes each camera device with a unique id', () => {
    const ids = new Set(factory.cameraDevices.map((device) => device.id))

    expect(ids.size).toBe(factory.cameraDevices.length)
  })

  it('allows adding and removing a onCameraDevicesChanged listener', () => {
    const subscription = factory.addOnCameraDevicesChangedListener(() => {
      /* noop */
    })

    expect(typeof subscription.remove).toBe('function')
    subscription.remove()
  })

  it('gets supported CameraExtensions for each device on Android', async () => {
    if (Platform.OS !== 'android') {
      console.log('[SKIP] getSupportedExtensions: only available on Android')
      return
    }

    for (const device of factory.cameraDevices) {
      const extensions = await factory.getSupportedExtensions(device)

      expect(Array.isArray(extensions)).toBe(true)
      for (const extension of extensions) {
        expect(['bokeh', 'hdr', 'night', 'face-retouch', 'auto']).toContain(
          extension.type,
        )
        expect(typeof extension.supportsFrameStreaming).toBe('boolean')
      }
    }
  })
})

describe('VisionCamera - CameraDevice metadata', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes valid metadata on every CameraDevice', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.id).toBe('string')
      expect(device.id.length).toBeGreaterThan(0)
      expect(typeof device.modelID).toBe('string')
      expect(typeof device.localizedName).toBe('string')
      expect(typeof device.manufacturer).toBe('string')
      expect(VALID_DEVICE_TYPES).toContain(device.type)
      expect(VALID_POSITIONS).toContain(device.position)
      expect(typeof device.isVirtualDevice).toBe('boolean')
      expect(Array.isArray(device.physicalDevices)).toBe(true)
    }
  })

  it('marks virtual devices with matching physicalDevices', () => {
    for (const device of factory.cameraDevices) {
      if (device.isVirtualDevice) {
        expect(device.physicalDevices.length).toBeGreaterThan(0)
      } else {
        expect(device.physicalDevices.length).toBe(0)
      }
    }
  })

  it('exposes sensible mediaTypes for every device', () => {
    for (const device of factory.cameraDevices) {
      expect(Array.isArray(device.mediaTypes)).toBe(true)
      expect(device.mediaTypes.length).toBeGreaterThan(0)
      for (const mediaType of device.mediaTypes) {
        expect(VALID_MEDIA_TYPES).toContain(mediaType)
      }
    }
  })
})

describe('VisionCamera - CameraDevice output capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes supportedPixelFormats on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(Array.isArray(device.supportedPixelFormats)).toBe(true)
      expect(device.supportedPixelFormats.length).toBeGreaterThan(0)
    }
  })

  it('returns valid supported resolutions for every OutputStreamType', () => {
    for (const device of factory.cameraDevices) {
      for (const streamType of VALID_OUTPUT_STREAM_TYPES) {
        const resolutions = device.getSupportedResolutions(streamType)

        expect(Array.isArray(resolutions)).toBe(true)
        for (const resolution of resolutions) {
          expect(resolution.width).toBeGreaterThan(0)
          expect(resolution.height).toBeGreaterThan(0)
        }
      }
    }
  })

  it('returns resolutions for the basic video stream type for every video device', () => {
    for (const device of factory.cameraDevices) {
      if (!device.mediaTypes.includes('video')) {
        continue
      }

      const photoResolutions = device.getSupportedResolutions('photo')
      const videoResolutions = device.getSupportedResolutions('video')
      const streamResolutions = device.getSupportedResolutions('stream')

      expect(photoResolutions.length).toBeGreaterThan(0)
      expect(videoResolutions.length).toBeGreaterThan(0)
      expect(streamResolutions.length).toBeGreaterThan(0)
    }
  })
})

describe('VisionCamera - CameraDevice frame rate and HDR capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes valid supportedFPSRanges on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(Array.isArray(device.supportedFPSRanges)).toBe(true)
      for (const range of device.supportedFPSRanges) {
        expect(range.min).toBeGreaterThan(0)
        expect(range.max).toBeGreaterThanOrEqual(range.min)
      }
    }
  })

  it('reports supportsFPS true for every min value in supportedFPSRanges', () => {
    for (const device of factory.cameraDevices) {
      for (const range of device.supportedFPSRanges) {
        expect(device.supportsFPS(range.min)).toBe(true)
        expect(device.supportsFPS(range.max)).toBe(true)
      }
    }
  })

  it('reports supportsFPS false for an absurdly high fps', () => {
    for (const device of factory.cameraDevices) {
      expect(device.supportsFPS(999999)).toBe(false)
    }
  })

  it('exposes a boolean supportsPhotoHDR on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsPhotoHDR).toBe('boolean')
    }
  })

  it('exposes valid supportedVideoDynamicRanges on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(Array.isArray(device.supportedVideoDynamicRanges)).toBe(true)
      for (const dynamicRange of device.supportedVideoDynamicRanges) {
        expect(['sdr-8-bit', 'hdr-10-bit', 'unknown']).toContain(
          dynamicRange.bitDepth,
        )
        expect(['video', 'full', 'unknown']).toContain(dynamicRange.colorRange)
        expect(typeof dynamicRange.colorSpace).toBe('string')
      }
    }
  })
})

describe('VisionCamera - CameraDevice stabilization capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it("reports 'off' as a supported video stabilization mode on every device", () => {
    for (const device of factory.cameraDevices) {
      expect(device.supportsVideoStabilizationMode('off')).toBe(true)
    }
  })

  it("reports 'auto' as a supported video stabilization mode on every device", () => {
    for (const device of factory.cameraDevices) {
      expect(device.supportsVideoStabilizationMode('auto')).toBe(true)
    }
  })

  it("reports 'off' as a supported preview stabilization mode on every device", () => {
    for (const device of factory.cameraDevices) {
      expect(device.supportsPreviewStabilizationMode('off')).toBe(true)
    }
  })

  it("reports 'auto' as a supported preview stabilization mode on every device", () => {
    for (const device of factory.cameraDevices) {
      expect(device.supportsPreviewStabilizationMode('auto')).toBe(true)
    }
  })

  it('exposes boolean supportsPreviewImage on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsPreviewImage).toBe('boolean')
    }
  })

  it('exposes boolean supportsSpeedQualityPrioritization on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsSpeedQualityPrioritization).toBe('boolean')
    }
  })
})

describe('VisionCamera - CameraDevice focus / exposure / white balance capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes boolean focus capabilities on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsFocusMetering).toBe('boolean')
      expect(typeof device.supportsFocusLocking).toBe('boolean')
      expect(typeof device.supportsSmoothAutoFocus).toBe('boolean')
    }
  })

  it('exposes boolean exposure capabilities and sensible bias ranges on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsExposureMetering).toBe('boolean')
      expect(typeof device.supportsExposureLocking).toBe('boolean')
      expect(typeof device.supportsExposureBias).toBe('boolean')

      if (device.supportsExposureBias) {
        expect(device.maxExposureBias).toBeGreaterThanOrEqual(
          device.minExposureBias,
        )
      } else {
        expect(device.minExposureBias).toBe(0)
        expect(device.maxExposureBias).toBe(0)
      }
    }
  })

  it('exposes boolean white balance capabilities on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsWhiteBalanceMetering).toBe('boolean')
      expect(typeof device.supportsWhiteBalanceLocking).toBe('boolean')
      expect(typeof device.maxWhiteBalanceGain).toBe('number')
    }
  })

  it('exposes a sensible maxWhiteBalanceGain when white balance locking is supported', () => {
    for (const device of factory.cameraDevices) {
      if (!device.supportsWhiteBalanceLocking) {
        continue
      }

      expect(device.maxWhiteBalanceGain).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('VisionCamera - CameraDevice flash / torch / low-light capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes boolean hasFlash/hasTorch on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.hasFlash).toBe('boolean')
      expect(typeof device.hasTorch).toBe('boolean')
    }
  })

  it('exposes boolean supportsLowLightBoost on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsLowLightBoost).toBe('boolean')
    }
  })

  it('exposes boolean supportsDistortionCorrection on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.supportsDistortionCorrection).toBe('boolean')
    }
  })
})

describe('VisionCamera - CameraDevice zoom capabilities', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes a sensible zoom range on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(device.minZoom).toBeGreaterThan(0)
      expect(device.maxZoom).toBeGreaterThanOrEqual(device.minZoom)
    }
  })

  it('exposes zoomLensSwitchFactors on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(Array.isArray(device.zoomLensSwitchFactors)).toBe(true)

      if (device.isVirtualDevice) {
        for (const factor of device.zoomLensSwitchFactors) {
          expect(factor).toBeGreaterThan(0)
        }
      } else {
        expect(device.zoomLensSwitchFactors.length).toBe(0)
      }
    }
  })
})

describe('VisionCamera - CameraDevice iOS-specific metadata', () => {
  beforeAll(async () => {
    factory = await VisionCamera.createDeviceFactory()
  })

  it('exposes Continuity Camera info only on iOS', () => {
    if (Platform.OS !== 'ios') {
      for (const device of factory.cameraDevices) {
        expect(device.isContinuityCamera).toBe(false)
      }
      return
    }

    for (const device of factory.cameraDevices) {
      expect(typeof device.isContinuityCamera).toBe('boolean')
    }
  })

  it('exposes lensAperture as a number on every device', () => {
    for (const device of factory.cameraDevices) {
      expect(typeof device.lensAperture).toBe('number')
    }
  })

  it('exposes focalLength as a positive number or undefined on every device', () => {
    let sawAnyFocalLength = false

    for (const device of factory.cameraDevices) {
      if (device.focalLength == null) {
        continue
      }

      sawAnyFocalLength = true
      expect(device.focalLength).toBeGreaterThan(0)
    }

    if (!sawAnyFocalLength) {
      console.log(
        '[SKIP] focalLength: no device on this platform reports a focal length',
      )
    }
  })
})

describe('VisionCamera - supportsMultiCamSessions', () => {
  it('exposes a boolean supportsMultiCamSessions flag', () => {
    expect(typeof VisionCamera.supportsMultiCamSessions).toBe('boolean')
  })
})
