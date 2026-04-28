import {
  beforeAll,
  describe,
  expect,
  it,
  waitUntil,
} from 'react-native-harness'
import type { CameraDeviceFactory } from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Session', () => {
  let factory: CameraDeviceFactory

  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
  })

  it('configures, starts and stops a session for every listed device', async () => {
    const devices = factory.cameraDevices
    expect(devices.length).toBeGreaterThan(0)

    for (const device of devices) {
      const session = await VisionCamera.createCameraSession(false)
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })

      let started = false
      let stopped = false
      const startSub = session.addOnStartedListener(() => {
        started = true
      })
      const stopSub = session.addOnStoppedListener(() => {
        stopped = true
      })

      const controllers = await session.configure([
        {
          input: device,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      expect(controllers.length).toBe(1)
      expect(controllers[0]?.device.id).toBe(device.id)

      await session.start()
      await waitUntil(() => started, { timeout: 10_000 })
      await session.stop()
      await waitUntil(() => stopped, { timeout: 10_000 })

      startSub.remove()
      stopSub.remove()
      console.log(
        `session ok: ${device.position}:${device.id} (${device.localizedName})`,
      )
    }
  })

  it('fires onStarted/onStopped exactly once per lifecycle', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    let startedCount = 0
    let stoppedCount = 0
    const startSub = session.addOnStartedListener(() => {
      startedCount++
    })
    const stopSub = session.addOnStoppedListener(() => {
      stoppedCount++
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    await session.start()
    await waitUntil(() => startedCount === 1, { timeout: 10_000 })
    await session.stop()
    await waitUntil(() => stoppedCount === 1, { timeout: 10_000 })

    expect(startedCount).toBe(1)
    expect(stoppedCount).toBe(1)

    startSub.remove()
    stopSub.remove()
  })

  it('stops delivering events after a listener subscription is removed', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let startedAfterRemove = 0
    const startSub = session.addOnStartedListener(() => {
      startedAfterRemove++
    })
    startSub.remove()

    // Second listener we keep attached so we can observe that the session
    // actually started before requesting a stop.
    let actuallyStarted = false
    const secondStartSub = session.addOnStartedListener(() => {
      actuallyStarted = true
    })

    let stopped = false
    const stopSub = session.addOnStoppedListener(() => {
      stopped = true
    })

    await session.start()
    await waitUntil(() => actuallyStarted, { timeout: 10_000 })
    await session.stop()
    await waitUntil(() => stopped, { timeout: 10_000 })

    expect(startedAfterRemove).toBe(0)
    secondStartSub.remove()
    stopSub.remove()
  })

  it('registers an onError listener without throwing', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const subscription = session.addOnErrorListener(() => {})
    expect(subscription.remove).toBeDefined()
    subscription.remove()
  })

  it('registers interruption listeners without throwing', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const a = session.addOnInterruptionStartedListener(() => {})
    const b = session.addOnInterruptionEndedListener(() => {})
    a.remove()
    b.remove()
  })

  it('reconfigures a running session with a new output set', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })

    const controllers = await session.configure([
      {
        input: device,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])
    expect(controllers.length).toBe(1)

    await session.stop()
  })

  it('supports a multi-cam session when the platform allows it', async () => {
    if (!VisionCamera.supportsMultiCamSessions) {
      console.log('[SKIP] multi-cam session: not supported on this platform')
      return
    }
    const back = factory.getDefaultCamera('back')
    const front = factory.getDefaultCamera('front')
    if (back == null || front == null) return

    const session = await VisionCamera.createCameraSession(true)
    const backPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const frontPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: back,
        outputs: [{ output: backPhoto, mirrorMode: 'off' }],
        constraints: [],
      },
      {
        input: front,
        outputs: [{ output: frontPhoto, mirrorMode: 'on' }],
        constraints: [],
      },
    ])
    expect(controllers.length).toBe(2)
    expect(controllers[0]?.device.id).toBe(back.id)
    expect(controllers[1]?.device.id).toBe(front.id)

    let started = false
    const sub = session.addOnStartedListener(() => {
      started = true
    })
    await session.start()
    await waitUntil(() => started, { timeout: 15_000 })
    await session.stop()
    sub.remove()
  })

  it('configures, starts and stops a multi-cam session for every supported device combination', async () => {
    if (!VisionCamera.supportsMultiCamSessions) {
      console.log(
        '[SKIP] multi-cam combinations: not supported on this platform',
      )
      return
    }
    const combinations = factory.supportedMultiCamDeviceCombinations
    if (combinations.length === 0) {
      console.log(
        '[SKIP] multi-cam combinations: no combinations reported on this device',
      )
      return
    }

    for (const combination of combinations) {
      const session = await VisionCamera.createCameraSession(true)
      const connections = combination.map((device) => ({
        input: device,
        outputs: [
          {
            output: VisionCamera.createPhotoOutput({
              targetResolution: CommonResolutions.HD_4_3,
              containerFormat: 'jpeg' as const,
              quality: 0.8,
              qualityPrioritization: 'balanced' as const,
            }),
            mirrorMode: 'auto' as const,
          },
        ],
        constraints: [],
      }))

      const controllers = await session.configure(connections)
      expect(controllers.length).toBe(combination.length)
      for (let i = 0; i < combination.length; i++) {
        expect(controllers[i]?.device.id).toBe(combination[i]?.id)
      }

      let started = false
      const sub = session.addOnStartedListener(() => {
        started = true
      })
      await session.start()
      await waitUntil(() => started, { timeout: 15_000 })
      await session.stop()
      sub.remove()

      const description = combination
        .map((d) => `${d.position}:${d.id}`)
        .join(', ')
      console.log(`multi-cam session ok: [${description}]`)
    }
  })
})
