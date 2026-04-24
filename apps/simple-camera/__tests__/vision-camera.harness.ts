import { describe, expect, it } from 'react-native-harness'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera Harness', () => {
  it('creates a session, captures a photo from the default back camera', async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    const deviceFactory = await VisionCamera.createDeviceFactory()
    const device = deviceFactory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) {
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.FHD_4_3,
      containerFormat: 'jpeg',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)

    await session.start()

    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    expect(photo).toBeDefined()
    photo.dispose()

    await session.stop()
  })
})
