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
      const tooHighZoom = controller.maxZoom + 1
      const tooLowZoom = controller.minZoom - 1
      await expect(controller.setZoom(tooHighZoom)).rejects.toThrow()
      await expect(controller.setZoom(tooLowZoom)).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('runs a zoom animation', async (context) => {
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
      if (controller.minZoom === controller.maxZoom) {
        return context.skip('zoom animation: device exposes no zoom range')
      }

      await controller.setZoom(controller.minZoom)
      const targetZoom = Math.min(controller.maxZoom, controller.minZoom + 0.1)
      await controller.startZoomAnimation(targetZoom, 100)
      expect(controller.zoom).toBeCloseTo(targetZoom, 1)
      await controller.cancelZoomAnimation()
    } finally {
      await session.stop()
    }
  })

  // TODO(Android): Re-enable once initial CameraX control config is applied after the camera is active.
  it.skip('honors initialZoom passed to configure', async () => {
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

  it('sets torchMode on/off when the device has a torch', async (context) => {
    if (!backDevice.hasTorch) {
      return context.skip('torch: device has no torch')
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

  it('rejects setTorchMode on a device without a torch', async (context) => {
    const noTorchDevice = factory.cameraDevices.find((d) => !d.hasTorch)
    if (noTorchDevice == null) {
      return context.skip(
        'no-torch path: no device on this system lacks a torch',
      )
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
        input: noTorchDevice,
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

  it('enables torch at min/max strength when the device supports it', async (context) => {
    if (!backDevice.hasTorch) {
      return context.skip('torch strength: device has no torch')
    }
    if (!backDevice.supportsTorchStrength) {
      return context.skip(
        'torch strength: device does not support custom strength',
      )
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
      //
      // torchStrength is asserted within range rather than equal to the
      // requested value because iOS's `AVCaptureDevice.torchLevel` reflects
      // actual hardware brightness, which the system silently caps under
      // thermal pressure (typical on CI device farms running back-to-back).
      // CameraX's `torchStrengthLevel` echoes the requested value, but the
      // shared assertion has to tolerate iOS's hardware-state semantics.
      await controller.enableTorchWithStrength(backDevice.maxTorchStrength)
      expect(controller.torchMode).toBe('on')
      expect(controller.torchStrength).toBeGreaterThanOrEqual(
        backDevice.minTorchStrength,
      )
      expect(controller.torchStrength).toBeLessThanOrEqual(
        backDevice.maxTorchStrength,
      )

      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
      // torchStrength reports the last-configured level even when the torch is
      // off — that's what both AVCaptureDevice.torchLevel and CameraX's
      // torchStrengthLevel return.
      expect(controller.torchStrength).toBeGreaterThanOrEqual(
        backDevice.minTorchStrength,
      )
      expect(controller.torchStrength).toBeLessThanOrEqual(
        backDevice.maxTorchStrength,
      )
    } finally {
      await session.stop()
    }
  })

  it('rejects enableTorchWithStrength outside the device range', async (context) => {
    if (!backDevice.hasTorch || !backDevice.supportsTorchStrength) {
      return context.skip(
        'torch strength out-of-range: device does not support custom strength',
      )
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
      const tooHighTorchStrength = backDevice.maxTorchStrength + 1
      await expect(
        controller.enableTorchWithStrength(tooHighTorchStrength),
      ).rejects.toThrow()
      // Below min — `0` on iOS triggers Apple's NSException without the
      // internal floor, and `0` on Android is outside CameraX's [1, max].
      const tooLowTorchStrength = backDevice.minTorchStrength - 1
      await expect(
        controller.enableTorchWithStrength(tooLowTorchStrength),
      ).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  it('rejects enableTorchWithStrength on a device without torch strength support', async (context) => {
    const noStrengthDevice = factory.cameraDevices.find(
      (d) => !d.supportsTorchStrength,
    )
    if (noStrengthDevice == null) {
      return context.skip(
        'no-torch-strength path: every device on this system supports custom torch strength',
      )
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
        input: noStrengthDevice,
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

  it('sets exposure bias to in-range values when the device supports it', async (context) => {
    if (!backDevice.supportsExposureBias) {
      return context.skip('exposureBias: not supported on this device')
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
      const exposureBiases = [
        Math.min(1, backDevice.maxExposureBias),
        Math.max(-1, backDevice.minExposureBias),
        0,
      ].filter((bias, index, biases) => biases.indexOf(bias) === index)

      for (const bias of exposureBiases) {
        await controller.setExposureBias(bias)
        expect(controller.exposureBias).toBeCloseTo(bias, 4)
      }
    } finally {
      await session.stop()
    }
  })

  it('rejects setExposureBias outside the device range', async (context) => {
    if (!backDevice.supportsExposureBias) {
      return context.skip(
        'exposureBias out-of-range: not supported on this device',
      )
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
      const tooHighExposureBias = backDevice.maxExposureBias + 1
      const tooLowExposureBias = backDevice.minExposureBias - 1
      await expect(
        controller.setExposureBias(tooHighExposureBias),
      ).rejects.toThrow()
      await expect(
        controller.setExposureBias(tooLowExposureBias),
      ).rejects.toThrow()
    } finally {
      await session.stop()
    }
  })

  // TODO(Android): Re-enable once initial CameraX control config is applied after the camera is active.
  it.skip('honors initialExposureBias passed to configure', async (context) => {
    if (!backDevice.supportsExposureBias) {
      return context.skip(
        'initialExposureBias: device does not support exposure bias',
      )
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

  it('runs focusTo and resetFocus when the device supports focus metering', async (context) => {
    if (!backDevice.supportsFocusMetering) {
      return context.skip('focusTo: device does not support focus metering')
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

  it('enables low-light boost via CameraController.configure when supported', async (context) => {
    const lowLightDevice = factory.cameraDevices.find(
      (d) => d.supportsLowLightBoost,
    )
    if (lowLightDevice == null) {
      return context.skip(
        'low-light boost: no device on this system supports it',
      )
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
        input: lowLightDevice,
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
      subscription.remove()
    } finally {
      await session.stop()
    }
  })

  it('locks focus to a specific lens position when the device supports it', async (context) => {
    if (!backDevice.supportsFocusLocking) {
      return context.skip('focus locking: not supported on this device')
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
      // Lock focus at a specific lens position. AVCaptureDevice quantizes
      // lensPosition to discrete steps, so use a loose tolerance on readback.
      await controller.setFocusLocked(0.5)
      expect(controller.focusMode).toBe('locked')
      expect(controller.lensPosition).toBeCloseTo(0.5, 1)

      // Lock at whatever the current value is.
      await controller.lockCurrentFocus()
      expect(controller.focusMode).toBe('locked')
    } finally {
      await session.stop()
    }
  })

  it('locks exposure to a specific duration/ISO when the device supports it', async (context) => {
    if (!backDevice.supportsExposureLocking) {
      return context.skip('exposure locking: not supported on this device')
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
      // Pick a mid-range duration/ISO the device must accept. Hardware
      // quantizes both, so only assert mode here.
      const duration =
        (controller.minExposureDuration + controller.maxExposureDuration) / 2
      const iso = (controller.minISO + controller.maxISO) / 2

      // iOS reports 'custom' for manual duration/ISO; Android may report
      // 'locked'. Accept either so the test stays stable across platforms.
      await controller.setExposureLocked(duration, iso)
      expect(controller.exposureMode).toBeOneOf(['custom', 'locked'])

      await controller.lockCurrentExposure()
      expect(controller.exposureMode).toBeOneOf(['custom', 'locked'])
    } finally {
      await session.stop()
    }
  })

  it('locks white-balance to specific gains when the device supports it', async (context) => {
    if (!backDevice.supportsWhiteBalanceLocking) {
      return context.skip('white-balance locking: not supported on this device')
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
      // Use neutral 1.0 gains — guaranteed to be inside the [1, maxGain]
      // range every supported device exposes.
      await controller.setWhiteBalanceLocked({
        redGain: 1,
        greenGain: 1,
        blueGain: 1,
      })
      expect(controller.whiteBalanceMode).toBe('locked')

      await controller.lockCurrentWhiteBalance()
      expect(controller.whiteBalanceMode).toBe('locked')
    } finally {
      await session.stop()
    }
  })
})
