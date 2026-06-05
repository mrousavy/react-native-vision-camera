import { beforeAll, describe, expect, it } from 'react-native-harness'
import type {
  CameraDevice,
  CameraDeviceFactory,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Controller Zoom', () => {
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
})
