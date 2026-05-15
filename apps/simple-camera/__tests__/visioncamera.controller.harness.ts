import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraController,
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

function expectDeviceTorchStrengthRange(device: CameraDevice): void {
  if (device.supportsTorchStrength) {
    expect(device.hasTorch).toBe(true)
    expect(device.minTorchStrength).toBeGreaterThan(0)
    expect(device.maxTorchStrength).toBeGreaterThanOrEqual(
      device.minTorchStrength,
    )
  } else {
    expect(device.minTorchStrength).toBe(0)
    expect(device.maxTorchStrength).toBe(0)
  }
}

function expectTorchStrengthInRange(
  controller: CameraController,
  device: CameraDevice,
): number {
  expect(device.supportsTorchStrength).toBe(true)
  const strength = controller.torchStrength
  expect(strength).toBeGreaterThanOrEqual(device.minTorchStrength)
  expect(strength).toBeLessThanOrEqual(device.maxTorchStrength)
  return strength
}

function expectTorchStrengthOffValue(
  controller: CameraController,
  device: CameraDevice,
): number {
  const strength = controller.torchStrength
  if (!device.supportsTorchStrength) {
    expect(strength).toBe(0)
    return strength
  }

  // Native APIs differ in what they expose while the torch is off:
  // some report an inactive sentinel `0`, others keep reporting the
  // configured/default level. Anything else is invalid.
  if (strength === 0) return strength
  expect(strength).toBeGreaterThanOrEqual(device.minTorchStrength)
  expect(strength).toBeLessThanOrEqual(device.maxTorchStrength)
  return strength
}

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

  it('reports coherent torch strength capabilities for every device', () => {
    for (const device of factory.cameraDevices) {
      expectDeviceTorchStrengthRange(device)
    }
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

  it('sets torchMode on/off independently from torchStrength', async () => {
    if (!backDevice.hasTorch) {
      console.log('[SKIP] torch: device has no torch')
      return
    }
    expectDeviceTorchStrengthRange(backDevice)
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
      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
      expectTorchStrengthOffValue(controller, backDevice)

      await controller.setTorchMode('on')
      expect(controller.torchMode).toBe('on')
      if (backDevice.supportsTorchStrength) {
        expectTorchStrengthInRange(controller, backDevice)
      } else {
        expect(controller.torchStrength).toBe(0)
      }

      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
      expectTorchStrengthOffValue(controller, backDevice)
    } finally {
      await session.stop()
    }
  })

  it('rejects setTorchMode on a device without a torch', async () => {
    const noTorchDevice = factory.cameraDevices.find((d) => !d.hasTorch)
    if (noTorchDevice == null) {
      console.log(
        '[SKIP] no-torch path: no device on this system lacks a torch',
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

  it('enables torch at supported custom strength boundaries', async () => {
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
    expectDeviceTorchStrengthRange(backDevice)
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
      await controller.enableTorchWithStrength(backDevice.minTorchStrength)
      expect(controller.torchMode).toBe('on')
      const minReadback = expectTorchStrengthInRange(controller, backDevice)

      // Max strength catches off-by-one mappings where Android's native
      // [1, maxTorchStrengthLevel] range is accidentally treated as [0, 1].
      await controller.enableTorchWithStrength(backDevice.maxTorchStrength)
      expect(controller.torchMode).toBe('on')
      const maxReadback = expectTorchStrengthInRange(controller, backDevice)
      expect(maxReadback).toBeGreaterThanOrEqual(minReadback)

      await controller.setTorchMode('off')
      expect(controller.torchMode).toBe('off')
      expectTorchStrengthOffValue(controller, backDevice)
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
    expectDeviceTorchStrengthRange(backDevice)
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
    const noStrengthDevice = factory.cameraDevices.find(
      (d) => !d.supportsTorchStrength,
    )
    if (noStrengthDevice == null) {
      console.log(
        '[SKIP] no-torch-strength path: every device on this system supports custom torch strength',
      )
      return
    }
    expectDeviceTorchStrengthRange(noStrengthDevice)
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
      expect(controller.torchStrength).toBe(0)
      await expect(controller.enableTorchWithStrength(0.5)).rejects.toThrow()
      expect(controller.torchStrength).toBe(0)
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
    const lowLightDevice = factory.cameraDevices.find(
      (d) => d.supportsLowLightBoost,
    )
    if (lowLightDevice == null) {
      console.log(
        '[SKIP] low-light boost: no device on this system supports it',
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
      expect(subscription.remove).toBeDefined()
      subscription.remove()
    } finally {
      await session.stop()
    }
  })

  it('locks focus to a specific lens position when the device supports it', async () => {
    if (!backDevice.supportsFocusLocking) {
      console.log('[SKIP] focus locking: not supported on this device')
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

  it('locks exposure to a specific duration/ISO when the device supports it', async () => {
    if (!backDevice.supportsExposureLocking) {
      console.log('[SKIP] exposure locking: not supported on this device')
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

  it('locks white-balance to specific gains when the device supports it', async () => {
    if (!backDevice.supportsWhiteBalanceLocking) {
      console.log('[SKIP] white-balance locking: not supported on this device')
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
