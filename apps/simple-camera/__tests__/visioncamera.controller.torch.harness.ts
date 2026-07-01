import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Controller - Torch', () => {
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
})
