import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Devices', () => {
  let factory: CameraDeviceFactory

  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
  })

  it('enumerates at least one back and one front camera', () => {
    const back = factory.getDefaultCamera('back')
    const front = factory.getDefaultCamera('front')
    expect(back).toBeDefined()
    expect(front).toBeDefined()

    const hasBack = factory.cameraDevices.some((d) => d.position === 'back')
    const hasFront = factory.cameraDevices.some((d) => d.position === 'front')
    expect(hasBack).toBe(true)
    expect(hasFront).toBe(true)
  })

  it('logs external cameras when present (optional)', () => {
    const external = factory.cameraDevices.filter(
      (d) => d.position === 'external',
    )
    if (external.length === 0) {
      console.log('[SKIP] external cameras: none available on this device')
      return
    }
    for (const device of external) {
      console.log(
        `external camera: id=${device.id} name=${device.localizedName}`,
      )
    }
  })

  it('returns the same device when calling getCameraForId with a known id', () => {
    const first = factory.cameraDevices[0]
    expect(first).toBeDefined()
    if (first == null) return

    const looked = factory.getCameraForId(first.id)
    expect(looked).toBeDefined()
    expect(looked?.id).toBe(first.id)
  })

  it('returns undefined when calling getCameraForId with an unknown id', () => {
    const looked = factory.getCameraForId(
      `definitely-not-a-real-camera-id-${Date.now()}`,
    )
    expect(looked).toBe(undefined)
  })

  it('returns an array from getSupportedExtensions for the default back camera', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) {
      console.log('[SKIP] getSupportedExtensions: no back device')
      return
    }
    const extensions = await factory.getSupportedExtensions(device)
    console.log(
      `back camera extensions: ${extensions.map((e) => e.type).join(', ') || '(none)'}`,
    )
  })

  it('subscribes and unsubscribes a devices-changed listener', () => {
    const subscription = factory.addOnCameraDevicesChangedListener(() => {})
    expect(subscription.remove).toBeDefined()
    subscription.remove()
    subscription.remove()
  })

  it('reports sane capability invariants for each device', () => {
    for (const device of factory.cameraDevices) {
      const label = `${device.position}:${device.id}`

      expect(device.minZoom).toBeLessThanOrEqual(device.maxZoom)

      if (device.supportsExposureBias) {
        expect(device.minExposureBias).toBeLessThanOrEqual(
          device.maxExposureBias,
        )
      }

      if (device.mediaTypes.includes('video')) {
        expect(device.supportedPixelFormats.length).toBeGreaterThan(0)
        expect(device.supportedFPSRanges.length).toBeGreaterThan(0)
        for (const range of device.supportedFPSRanges) {
          expect(range.min).toBeLessThanOrEqual(range.max)
        }
      }

      console.log(
        `device ${label}: type=${device.type} virtual=${device.isVirtualDevice} ` +
          `zoom=${device.minZoom}-${device.maxZoom} fpsRanges=${device.supportedFPSRanges
            .map((r) => `${r.min}-${r.max}`)
            .join(',')}`,
      )
    }
  })

  it('logs optional hardware capabilities per device', () => {
    const capabilities: Array<{
      device: CameraDevice
      caps: Record<string, boolean | number | string>
    }> = factory.cameraDevices.map((device) => ({
      device,
      caps: {
        hasFlash: device.hasFlash,
        hasTorch: device.hasTorch,
        supportsPhotoHDR: device.supportsPhotoHDR,
        supportsLowLightBoost: device.supportsLowLightBoost,
        supportsFocusMetering: device.supportsFocusMetering,
        supportsExposureBias: device.supportsExposureBias,
        supports60fps: device.supportsFPS(60),
        supports120fps: device.supportsFPS(120),
        supportsCinematicStab:
          device.supportsVideoStabilizationMode('cinematic'),
        supportsPreviewImage: device.supportsPreviewImage,
        hdrRanges: device.supportedVideoDynamicRanges.length,
      },
    }))

    for (const { device, caps } of capabilities) {
      console.log(
        `caps ${device.position}:${device.id}: ${JSON.stringify(caps)}`,
      )
    }
  })

  it('returns non-empty getSupportedResolutions for photo/video streams on a back device', () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return
    const photoResolutions = device.getSupportedResolutions('photo')
    const videoResolutions = device.getSupportedResolutions('video')
    expect(photoResolutions.length).toBeGreaterThan(0)
    expect(videoResolutions.length).toBeGreaterThan(0)
  })

  it('gets and sets userPreferredCamera', () => {
    const back = factory.getDefaultCamera('back')
    if (back == null) return
    const previous = factory.userPreferredCamera
    factory.userPreferredCamera = back
    expect(factory.userPreferredCamera?.id).toBe(back.id)
    factory.userPreferredCamera = previous
  })

  it('returns an empty supportedMultiCamDeviceCombinations array when the platform does not support multi-cam', () => {
    if (VisionCamera.supportsMultiCamSessions) {
      console.log(
        '[SKIP] supportedMultiCamDeviceCombinations empty: platform supports multi-cam',
      )
      return
    }
    expect(factory.supportedMultiCamDeviceCombinations.length).toBe(0)
  })

  it('returns at least one supportedMultiCamDeviceCombinations combination when the platform supports multi-cam', () => {
    if (!VisionCamera.supportsMultiCamSessions) {
      console.log(
        '[SKIP] supportedMultiCamDeviceCombinations non-empty: multi-cam not supported on this platform',
      )
      return
    }
    expect(factory.supportedMultiCamDeviceCombinations.length).toBeGreaterThanOrEqual(1)
  })

  it('every device in a supportedMultiCamDeviceCombinations combination is also present in cameraDevices', () => {
    const combinations = factory.supportedMultiCamDeviceCombinations
    if (combinations.length === 0) {
      console.log(
        '[SKIP] supportedMultiCamDeviceCombinations device lookup: no combinations on this platform',
      )
      return
    }
    const knownIds = new Set(factory.cameraDevices.map((d) => d.id))
    for (const combination of combinations) {
      expect(combination.length).toBeGreaterThan(0)
      for (const device of combination) {
        expect(knownIds.has(device.id)).toBe(true)
      }
    }
  })

  it('logs every supported multi-cam device combination', () => {
    const combinations = factory.supportedMultiCamDeviceCombinations
    console.log(
      `supportedMultiCamDeviceCombinations: ${combinations.length} combinations`,
    )
    for (const [index, combination] of combinations.entries()) {
      const description = combination
        .map((d) => `${d.position}:${d.id}`)
        .join(', ')
      console.log(`  [${index}] ${description}`)
    }
  })
})
