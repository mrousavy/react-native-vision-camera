import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Controller Metering', () => {
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
      // Use neutral 1.0 gains: guaranteed to be inside the [1, maxGain]
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
