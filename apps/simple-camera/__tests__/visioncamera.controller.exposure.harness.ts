import { beforeAll, describe, expect, it } from 'react-native-harness'
import type { CameraDevice } from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Controller - Exposure', () => {
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
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
})
