import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Controller', () => {
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

  it('sets zoom to min, max, and mid values', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await controller.setZoom(controller.minZoom)
      expect(controller.zoom).toBe(controller.minZoom)

      await controller.setZoom(controller.maxZoom)
      expect(controller.zoom).toBe(controller.maxZoom)

      const mid = (controller.minZoom + controller.maxZoom) / 2
      await controller.setZoom(mid)
      expect(controller.zoom).toBeGreaterThanOrEqual(controller.minZoom)
      expect(controller.zoom).toBeLessThanOrEqual(controller.maxZoom)
    } finally {
      await session.stop()
    }
  })

  it('rejects setZoom outside the device zoom range', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(controller.setZoom(controller.maxZoom + 1)).rejects.toThrow()
      await expect(controller.setZoom(controller.minZoom - 1)).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('starts and cancels a zoom animation', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await controller.setZoom(controller.minZoom)
      controller.startZoomAnimation(controller.maxZoom, 0.5).catch(() => {
        // expected when we cancel the animation
      })
      await new Promise<void>((resolve) => setTimeout(resolve, 100))
      await controller.cancelZoomAnimation()
    } finally {
      await session.stop()
    }
  })

  it('honors initialZoom passed to configure', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const desiredZoom = Math.min(
      Math.max(backDevice.minZoom, 1.5),
      backDevice.maxZoom,
    )
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
        initialZoom: desiredZoom,
      },
    ])
    await session.start()
    try {
      expect(controller?.zoom).toBe(desiredZoom)
    } finally {
      await session.stop()
    }
  })

  it('sets torchMode on/off when the device has a torch', async () => {
    if (!backDevice.hasTorch) {
      console.log('[SKIP] torch: device has no torch')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await controller.setTorchMode('on')
      expect(controller.torchMode).toBe('on')

      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
    } finally {
      await session.stop()
    }
  })

  it('rejects setTorchMode on a device without a torch', async () => {
    if (backDevice.hasTorch) {
      console.log('[SKIP] no-torch path: backDevice has a torch')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(controller.setTorchMode('on')).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('enables torch at min/max strength when the device supports it', async () => {
    if (!backDevice.hasTorch) {
      console.log('[SKIP] torch strength: device has no torch')
      return
    }
    if (!backDevice.supportsTorchStrength) {
      console.log(
        '[SKIP] torch strength: device does not support custom strength',
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
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      // Min strength (dimmest level the device supports)
      await controller.enableTorchWithStrength(backDevice.minTorchStrength)
      expect(controller.torchMode).toBe('on')

      // Max strength — the case that caught the off-by-one in the original
      // CameraX strength mapping (a naive `1 + strength * maxLevel`
      // overshoots to `maxLevel + 1` and `setTorchStrengthLevel` throws
      // IllegalArgumentException). Must round-trip without throwing.
      await controller.enableTorchWithStrength(backDevice.maxTorchStrength)
      expect(controller.torchMode).toBe('on')
      expect(controller.torchStrength).toBe(backDevice.maxTorchStrength)

      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
      // torchStrength reports the last-configured level even when the torch is
      // off — that's what both AVCaptureDevice.torchLevel and CameraX's
      // torchStrengthLevel return.
      expect(controller.torchStrength).toBe(backDevice.maxTorchStrength)
    } finally {
      await session.stop()
    }
  })

  it('rejects enableTorchWithStrength outside the device range', async () => {
    if (!backDevice.hasTorch || !backDevice.supportsTorchStrength) {
      console.log(
        '[SKIP] torch strength out-of-range: device does not support custom strength',
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
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      // Above max — the case that catches the off-by-one in any future
      // [0, 1] -> [1, maxLevel] mapping on Android.
      await expect(
        controller.enableTorchWithStrength(backDevice.maxTorchStrength + 1),
      ).rejects.toThrow()
      // Below min — `0` on iOS triggers Apple's NSException without the
      // internal floor, and `0` on Android is outside CameraX's [1, max].
      await expect(
        controller.enableTorchWithStrength(backDevice.minTorchStrength - 1),
      ).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('rejects enableTorchWithStrength on a device without torch strength support', async () => {
    if (backDevice.supportsTorchStrength) {
      console.log(
        '[SKIP] no-torch-strength path: device supports custom strength',
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
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(controller.enableTorchWithStrength(0.5)).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('sets exposure bias to min/max when the device supports it', async () => {
    if (!backDevice.supportsExposureBias) {
      console.log('[SKIP] exposureBias: not supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      // AVCaptureDevice quantizes the requested bias to a discrete rational
      // step, so the readback may differ from the request by a tiny epsilon.
      await controller.setExposureBias(backDevice.maxExposureBias)
      expect(controller.exposureBias).toBeCloseTo(backDevice.maxExposureBias, 4)

      await controller.setExposureBias(backDevice.minExposureBias)
      expect(controller.exposureBias).toBeCloseTo(backDevice.minExposureBias, 4)

      await controller.setExposureBias(0)
      expect(controller.exposureBias).toBeCloseTo(0, 4)
    } finally {
      await session.stop()
    }
  })

  it('rejects setExposureBias outside the device range', async () => {
    if (!backDevice.supportsExposureBias) {
      console.log(
        '[SKIP] exposureBias out-of-range: not supported on this device',
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
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(
        controller.setExposureBias(backDevice.maxExposureBias + 1),
      ).rejects.toThrow()
      await expect(
        controller.setExposureBias(backDevice.minExposureBias - 1),
      ).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('honors initialExposureBias passed to configure', async () => {
    if (!backDevice.supportsExposureBias) {
      console.log(
        '[SKIP] initialExposureBias: device does not support exposure bias',
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
    const initial = backDevice.maxExposureBias
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
        initialExposureBias: initial,
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      expect(controller.exposureBias).toBeCloseTo(initial, 4)
    } finally {
      await session.stop()
    }
  })

  it('runs focusTo and resetFocus when the device supports focus metering', async () => {
    if (!backDevice.supportsFocusMetering) {
      console.log('[SKIP] focusTo: device does not support focus metering')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5)
      await controller.focusTo(point, {
        modes: ['AF'],
        responsiveness: 'snappy',
      })
      await controller.resetFocus()
    } finally {
      await session.stop()
    }
  })

  it('enables low-light boost via CameraController.configure when supported', async () => {
    if (!backDevice.supportsLowLightBoost) {
      console.log('[SKIP] low-light boost: not supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await controller.configure({ enableLowLightBoost: true })
      expect(controller.isLowLightBoostEnabled).toBe(true)
      await controller.configure({ enableLowLightBoost: false })
      expect(controller.isLowLightBoostEnabled).toBe(false)
    } finally {
      await session.stop()
    }
  })

  it('exposes sane controller state while running', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      expect(controller.device.id).toBe(backDevice.id)
      expect(controller.minZoom).toBeLessThanOrEqual(controller.maxZoom)
      expect(controller.zoom).toBeGreaterThanOrEqual(controller.minZoom)
      expect(controller.zoom).toBeLessThanOrEqual(controller.maxZoom)
      console.log(
        `controller: zoom=${controller.zoom} displayable=${controller.displayableZoomFactor} ` +
          `focusMode=${controller.focusMode} exposureMode=${controller.exposureMode} wbMode=${controller.whiteBalanceMode} ` +
          `isConnected=${controller.isConnected}`,
      )
    } finally {
      await session.stop()
    }
  })

  it('registers a subject area changed listener without throwing', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      const subscription = controller.addSubjectAreaChangedListener(() => {})
      expect(subscription.remove).toBeDefined()
      subscription.remove()
    } finally {
      await session.stop()
    }
  })

  it('rejects manual focus locking when the device does not support it', async () => {
    if (backDevice.supportsFocusLocking) {
      console.log('[SKIP] focus locking: supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(controller.setFocusLocked(0.5)).rejects.toThrow()
      await expect(controller.lockCurrentFocus()).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('rejects manual exposure locking when the device does not support it', async () => {
    if (backDevice.supportsExposureLocking) {
      console.log('[SKIP] exposure locking: supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(controller.setExposureLocked(1 / 60, 100)).rejects.toThrow()
      await expect(controller.lockCurrentExposure()).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('rejects manual white-balance locking when the device does not support it', async () => {
    if (backDevice.supportsWhiteBalanceLocking) {
      console.log('[SKIP] white-balance locking: supported on this device')
      return
    }
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')
    await session.start()

    try {
      await expect(
        controller.setWhiteBalanceLocked({
          redGain: 1,
          greenGain: 1,
          blueGain: 1,
        }),
      ).rejects.toThrow()
      await expect(controller.lockCurrentWhiteBalance()).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })
})
