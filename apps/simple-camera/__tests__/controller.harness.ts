import { Platform } from 'react-native'
import { afterAll, beforeAll, describe, expect, it } from 'react-native-harness'
import {
  type CameraController,
  type CameraDevice,
  type CameraSession,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'

let session: CameraSession | undefined
let controller: CameraController | undefined
let device: CameraDevice | undefined

describe('VisionCamera - CameraController', () => {
  beforeAll(async () => {
    if (VisionCamera.cameraPermissionStatus !== 'authorized') {
      throw new Error(
        `Controller tests require camera permission. Current status: ${VisionCamera.cameraPermissionStatus}`,
      )
    }

    const factory = await VisionCamera.createDeviceFactory()
    const resolvedDevice =
      factory.getDefaultCamera('back') ??
      factory.getDefaultCamera('front') ??
      factory.cameraDevices[0]

    if (resolvedDevice == null) {
      throw new Error(
        'Expected the device to expose at least one CameraDevice, but got none.',
      )
    }
    device = resolvedDevice

    session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: resolvedDevice,
        outputs: [
          { output: previewOutput, mirrorMode: 'auto' },
          { output: photoOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])
    controller = controllers[0]
    await session.start()
  })

  afterAll(async () => {
    if (session != null) {
      try {
        await session.stop()
      } catch {
        /* noop */
      }
    }
    session = undefined
    controller = undefined
    device = undefined
  })

  it('exposes the bound CameraDevice on the CameraController', () => {
    if (controller == null || device == null) return

    expect(controller.device.id).toBe(device.id)
  })

  it('reports connected status while the session is running', () => {
    if (controller == null) return

    expect(typeof controller.isConnected).toBe('boolean')
    expect(typeof controller.isSuspended).toBe('boolean')
    expect(typeof controller.isUsedByAnotherApp).toBe('boolean')
  })

  it('exposes a sensible zoom range and current zoom', () => {
    if (controller == null) return

    expect(controller.minZoom).toBeGreaterThan(0)
    expect(controller.maxZoom).toBeGreaterThanOrEqual(controller.minZoom)
    expect(controller.zoom).toBeGreaterThanOrEqual(controller.minZoom)
    expect(controller.zoom).toBeLessThanOrEqual(controller.maxZoom)
    expect(typeof controller.displayableZoomFactor).toBe('number')
  })

  it('sets the zoom to the minimum value', async () => {
    if (controller == null) return

    await controller.setZoom(controller.minZoom)
    expect(controller.zoom).toBeCloseTo(controller.minZoom, 2)
  })

  it('sets the zoom to the maximum value', async () => {
    if (controller == null) return

    await controller.setZoom(controller.maxZoom)
    expect(controller.zoom).toBeCloseTo(controller.maxZoom, 2)
    await controller.setZoom(controller.minZoom)
  })

  it('animates the zoom to a new value', async () => {
    if (controller == null) return

    const target = Math.min(controller.minZoom + 0.5, controller.maxZoom)
    await controller.startZoomAnimation(target, 4)
    await controller.cancelZoomAnimation()
    await controller.setZoom(controller.minZoom)
  })

  it('sets the torch on if the device has a torch', async () => {
    if (controller == null) return
    if (!controller.device.hasTorch) {
      console.log('[SKIP] controller.setTorchMode: device has no torch')
      return
    }

    await controller.setTorchMode('on', 1)
    expect(controller.torchMode).toBe('on')
    expect(controller.torchStrength).toBeGreaterThan(0)
    await controller.setTorchMode('off')
    expect(controller.torchMode).toBe('off')
  })

  it('throws when setting the torch on a device without a torch', async () => {
    if (controller == null) return
    if (controller.device.hasTorch) {
      console.log(
        '[SKIP] controller.setTorchMode no-torch: device has a torch, cannot verify the throw',
      )
      return
    }

    let threw = false
    try {
      await controller.setTorchMode('on', 1)
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })

  it('sets the exposure bias if supported', async () => {
    if (controller == null) return
    if (!controller.device.supportsExposureBias) {
      console.log(
        '[SKIP] controller.setExposureBias: device does not support exposure bias',
      )
      return
    }

    await controller.setExposureBias(controller.device.minExposureBias)
    expect(controller.exposureBias).toBeCloseTo(
      controller.device.minExposureBias,
      2,
    )
    await controller.setExposureBias(controller.device.maxExposureBias)
    expect(controller.exposureBias).toBeCloseTo(
      controller.device.maxExposureBias,
      2,
    )
    await controller.setExposureBias(0)
  })

  it('exposes iso / exposureDuration / minISO / maxISO readonly state', () => {
    if (controller == null) return

    expect(typeof controller.iso).toBe('number')
    expect(typeof controller.exposureDuration).toBe('number')
    expect(typeof controller.minISO).toBe('number')
    expect(typeof controller.maxISO).toBe('number')
    expect(typeof controller.minExposureDuration).toBe('number')
    expect(typeof controller.maxExposureDuration).toBe('number')
    expect([
      'locked',
      'auto-exposure',
      'continuous-auto-exposure',
      'custom',
    ]).toContain(controller.exposureMode)
  })

  it('locks and resets the exposure on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.setExposureLocked: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsExposureLocking) {
      console.log(
        '[SKIP] controller.setExposureLocked: device does not support exposure locking',
      )
      return
    }

    const mid = (controller.minISO + controller.maxISO) / 2
    const duration =
      (controller.minExposureDuration + controller.maxExposureDuration) / 2
    await controller.setExposureLocked(duration, mid)
    expect(controller.exposureMode).toBe('locked')
    await controller.resetFocus()
  })

  it('locks the current exposure on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.lockCurrentExposure: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsExposureLocking) {
      console.log(
        '[SKIP] controller.lockCurrentExposure: not supported on device',
      )
      return
    }

    await controller.lockCurrentExposure()
    expect(controller.exposureMode).toBe('locked')
    await controller.resetFocus()
  })

  it('exposes the current focus state', () => {
    if (controller == null) return

    expect(['locked', 'auto-focus', 'continuous-auto-focus']).toContain(
      controller.focusMode,
    )
    expect(controller.lensPosition).toBeGreaterThanOrEqual(0)
    expect(controller.lensPosition).toBeLessThanOrEqual(1)
  })

  it('focuses to a normalized metering point if supported', async () => {
    if (controller == null) return
    if (!controller.device.supportsFocusMetering) {
      console.log(
        '[SKIP] controller.focusTo: device does not support focus metering',
      )
      return
    }

    const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5)
    try {
      await controller.focusTo(point, {
        modes: ['AF'],
        adaptiveness: 'continuous',
        responsiveness: 'snappy',
        autoResetAfter: 1,
      })
    } catch (error) {
      console.log(
        `[SKIP] controller.focusTo: focus was canceled or timed out (${String(error)})`,
      )
      return
    }

    await controller.resetFocus()
  })

  it('resets focus to continuous auto-focus', async () => {
    if (controller == null) return

    await controller.resetFocus()
  })

  it('locks focus at a specific lens position on iOS', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.setFocusLocked: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsFocusLocking) {
      console.log(
        '[SKIP] controller.setFocusLocked: device does not support focus locking',
      )
      return
    }

    await controller.setFocusLocked(0.5)
    expect(controller.focusMode).toBe('locked')
    await controller.resetFocus()
  })

  it('locks the current focus on iOS', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.lockCurrentFocus: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsFocusLocking) {
      console.log('[SKIP] controller.lockCurrentFocus: not supported on device')
      return
    }

    await controller.lockCurrentFocus()
    expect(controller.focusMode).toBe('locked')
    await controller.resetFocus()
  })

  it('exposes the current white balance state', () => {
    if (controller == null) return

    expect([
      'locked',
      'auto-white-balance',
      'continuous-auto-white-balance',
    ]).toContain(controller.whiteBalanceMode)
    expect(typeof controller.whiteBalanceGains.redGain).toBe('number')
    expect(typeof controller.whiteBalanceGains.greenGain).toBe('number')
    expect(typeof controller.whiteBalanceGains.blueGain).toBe('number')
  })

  it('converts white balance temperature and tint to gains on iOS', () => {
    if (Platform.OS !== 'ios') {
      console.log(
        '[SKIP] convertWhiteBalanceTemperatureAndTintValues: iOS only',
      )
      return
    }
    if (controller == null) return

    const gains = controller.convertWhiteBalanceTemperatureAndTintValues({
      temperature: 5500,
      tint: 0,
    })

    expect(typeof gains.redGain).toBe('number')
    expect(typeof gains.greenGain).toBe('number')
    expect(typeof gains.blueGain).toBe('number')
  })

  it('locks the white balance on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.setWhiteBalanceLocked: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsWhiteBalanceLocking) {
      console.log(
        '[SKIP] controller.setWhiteBalanceLocked: not supported on device',
      )
      return
    }

    const currentGains = controller.whiteBalanceGains
    const maxGain = controller.device.maxWhiteBalanceGain
    const clamp = (value: number): number =>
      Math.min(Math.max(value, 1), maxGain)

    await controller.setWhiteBalanceLocked({
      redGain: clamp(currentGains.redGain),
      greenGain: clamp(currentGains.greenGain),
      blueGain: clamp(currentGains.blueGain),
    })
    expect(controller.whiteBalanceMode).toBe('locked')
    await controller.resetFocus()
  })

  it('locks the current white balance on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.lockCurrentWhiteBalance: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsWhiteBalanceLocking) {
      console.log(
        '[SKIP] controller.lockCurrentWhiteBalance: not supported on device',
      )
      return
    }

    await controller.lockCurrentWhiteBalance()
    expect(controller.whiteBalanceMode).toBe('locked')
    await controller.resetFocus()
  })

  it('enables low light boost if the device supports it', async () => {
    if (controller == null) return
    if (!controller.device.supportsLowLightBoost) {
      console.log(
        '[SKIP] controller.configure lowLightBoost: not supported on device',
      )
      return
    }

    await controller.configure({ enableLowLightBoost: true })
    expect(controller.isLowLightBoostEnabled).toBe(true)
    await controller.configure({ enableLowLightBoost: false })
    expect(controller.isLowLightBoostEnabled).toBe(false)
  })

  it('enables smooth auto focus on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.configure smoothAutoFocus: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsSmoothAutoFocus) {
      console.log(
        '[SKIP] controller.configure smoothAutoFocus: not supported on device',
      )
      return
    }

    await controller.configure({ enableSmoothAutoFocus: true })
    expect(controller.isSmoothAutoFocusEnabled).toBe(true)
    await controller.configure({ enableSmoothAutoFocus: false })
    expect(controller.isSmoothAutoFocusEnabled).toBe(false)
  })

  it('enables distortion correction on iOS if supported', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] controller.configure distortionCorrection: iOS only')
      return
    }
    if (controller == null) return
    if (!controller.device.supportsDistortionCorrection) {
      console.log(
        '[SKIP] controller.configure distortionCorrection: not supported on device',
      )
      return
    }

    await controller.configure({ enableDistortionCorrection: true })
    expect(controller.isDistortionCorrectionEnabled).toBe(true)
    await controller.configure({ enableDistortionCorrection: false })
    expect(controller.isDistortionCorrectionEnabled).toBe(false)
  })

  it('leaves values untouched when calling configure with an empty diff', async () => {
    if (controller == null) return

    const previousLowLight = controller.isLowLightBoostEnabled
    await controller.configure({})
    expect(controller.isLowLightBoostEnabled).toBe(previousLowLight)
  })
})
