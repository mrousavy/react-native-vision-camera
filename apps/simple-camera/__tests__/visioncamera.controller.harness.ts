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

  it('sets exposure bias to min/max when the device supports it', async (context) => {
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

  it('keeps an exposure lock applied between configure() and start()', async (context) => {
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

    // Lock exposure to a short duration / mid-range ISO after configure() but
    // before start() — what an app does to carry a known-good exposure into
    // the stream so the first visible frames are not blown out.
    const lockedDuration = Math.min(
      Math.max(1 / 60, controller.minExposureDuration),
      controller.maxExposureDuration,
    )
    const lockedISO = (controller.minISO + controller.maxISO) / 2
    await controller.setExposureLocked(lockedDuration, lockedISO)
    expect(controller.exposureMode).toBeOneOf(['custom', 'locked'])

    await session.start()

    try {
      // start() must not clobber an explicitly requested exposure lock by
      // resetting the device back to continuous auto-exposure at max ISO.
      console.log(
        `exposure lock across start(): requested iso=${lockedISO} ` +
          `actual iso=${controller.iso} mode=${controller.exposureMode} ` +
          `(device range ${controller.minISO}-${controller.maxISO})`,
      )
      expect(controller.exposureMode).toBeOneOf(['custom', 'locked'])
      expect(controller.iso).toBeCloseTo(lockedISO, -2)
    } finally {
      await session.stop()
    }
  })

  it('resumes auto-exposure near previously converged values on a fresh session', async (context) => {
    if (!backDevice.supportsExposureLocking) {
      return context.skip(
        'auto-exposure ISO readback: device does not support manual exposure, iso reads 0',
      )
    }

    // First session: let continuous auto-exposure converge and remember where
    // it landed.
    const firstSession = await VisionCamera.createCameraSession(false)
    const firstPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [firstController] = await firstSession.configure([
      {
        input: backDevice,
        outputs: [{ output: firstPhotoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (firstController == null) throw new Error('no controller')
    await firstSession.start()

    let convergedISO = 0
    try {
      await waitUntil(() => firstController.iso > 0, { timeout: 10_000 })
      // AE has converged once the ISO stops moving by more than 10% for a
      // sustained window. Elapsed time is the behavior under test here —
      // convergence is inherently a process over wall-clock time.
      let referenceISO = firstController.iso
      let stableSince = Date.now()
      await waitUntil(
        () => {
          const currentISO = firstController.iso
          const delta = Math.abs(currentISO - referenceISO)
          if (delta > referenceISO * 0.1) {
            referenceISO = currentISO
            stableSince = Date.now()
          }
          return Date.now() - stableSince >= 1_000
        },
        { timeout: 15_000 },
      )
      convergedISO = referenceISO
    } finally {
      await firstSession.stop()
    }

    if (convergedISO > firstController.maxISO * 0.5) {
      return context.skip(
        'AE continuity: scene too dark — converged ISO is near max ISO, so a reset-to-max regression is indistinguishable from correct convergence',
      )
    }

    // Second session on the same device: the first frames must resume near
    // the previously converged exposure (v4 behavior, and what the native
    // camera app does) — not restart at the format's max ISO and visibly
    // ramp down over several hundred ms.
    const secondSession = await VisionCamera.createCameraSession(false)
    const secondPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const [secondController] = await secondSession.configure([
      {
        input: backDevice,
        outputs: [{ output: secondPhotoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (secondController == null) throw new Error('no controller')
    await secondSession.start()

    try {
      await waitUntil(() => secondController.iso > 0, { timeout: 10_000 })
      const initialISO = secondController.iso
      console.log(
        `AE continuity: converged iso=${convergedISO} ` +
          `restart initial iso=${initialISO} ` +
          `(device max iso=${secondController.maxISO})`,
      )
      // 4x is a generous bound — the observed regression starts at the
      // format's max ISO, roughly 50x above the converged value.
      const maxAcceptableInitialISO = convergedISO * 4
      expect(initialISO).toBeLessThanOrEqual(maxAcceptableInitialISO)
    } finally {
      await secondSession.stop()
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
