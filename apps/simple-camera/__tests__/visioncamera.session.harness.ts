import {
  beforeAll,
  describe,
  expect,
  it,
  waitUntil,
} from 'react-native-harness'
import type { CameraDeviceFactory } from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

describe('VisionCamera - Session', () => {
  let factory: CameraDeviceFactory

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
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

      const started = deferred()
      const stopped = deferred()
      const startSub = session.addOnStartedListener(started.resolve)
      const stopSub = session.addOnStoppedListener(stopped.resolve)
      const errorSub = session.addOnErrorListener((error) => {
        started.reject(error)
        stopped.reject(error)
      })

      try {
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
        await withTimeout(started.promise, 10_000, 'session start')
        await session.stop()
        await withTimeout(stopped.promise, 10_000, 'session stop')
      } finally {
        startSub.remove()
        stopSub.remove()
        errorSub.remove()
      }
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
    const started = deferred()
    const stopped = deferred()
    const startSub = session.addOnStartedListener(() => {
      startedCount++
      started.resolve()
    })
    const stopSub = session.addOnStoppedListener(() => {
      stoppedCount++
      stopped.resolve()
    })
    const errorSub = session.addOnErrorListener((error) => {
      started.reject(error)
      stopped.reject(error)
    })

    try {
      await session.configure([
        {
          input: device,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      await session.start()
      await withTimeout(started.promise, 10_000, 'session start')

      await session.stop()
      await withTimeout(stopped.promise, 10_000, 'session stop')

      expect(startedCount).toBe(1)
      expect(stoppedCount).toBe(1)
    } finally {
      startSub.remove()
      stopSub.remove()
      errorSub.remove()
    }
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
    const started = deferred()
    const stopped = deferred()
    const secondStartSub = session.addOnStartedListener(started.resolve)
    const stopSub = session.addOnStoppedListener(stopped.resolve)
    const errorSub = session.addOnErrorListener((error) => {
      started.reject(error)
      stopped.reject(error)
    })

    try {
      await session.start()
      await withTimeout(started.promise, 10_000, 'session start')
      await session.stop()
      await withTimeout(stopped.promise, 10_000, 'session stop')

      expect(startedAfterRemove).toBe(0)
    } finally {
      secondStartSub.remove()
      stopSub.remove()
      errorSub.remove()
    }
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

  it('replaces the photo output with one of a different config while running', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const firstPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: firstPhotoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    try {
      const firstPhoto = await firstPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(firstPhoto.width).toBeGreaterThan(0)
      expect(firstPhoto.height).toBeGreaterThan(0)
      firstPhoto.dispose()

      const secondPhotoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.FHD_4_3,
        containerFormat: 'jpeg',
        quality: 0.5,
        qualityPrioritization: 'quality',
      })

      await session.configure([
        {
          input: device,
          outputs: [{ output: secondPhotoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const secondPhoto = await secondPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(secondPhoto.width).toBeGreaterThan(0)
      expect(secondPhoto.height).toBeGreaterThan(0)
      secondPhoto.dispose()

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('replaces the video output with one of a different config while running', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const firstVideoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })

    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: firstVideoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    try {
      const firstRecorder = await firstVideoOutput.createRecorder({})
      const firstFinished = deferred()
      await firstRecorder.startRecording(
        () => firstFinished.resolve(),
        firstFinished.reject,
      )
      await new Promise<void>((resolve) => setTimeout(resolve, 500))
      await firstRecorder.stopRecording()
      await withTimeout(firstFinished.promise, 15_000, 'first recording finish')

      const secondVideoOutput = VisionCamera.createVideoOutput({
        targetResolution: CommonResolutions.FHD_16_9,
        enableAudio: false,
      })

      await session.configure([
        {
          input: device,
          outputs: [{ output: secondVideoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const secondRecorder = await secondVideoOutput.createRecorder({})
      const secondFinished = deferred()
      await secondRecorder.startRecording(
        () => secondFinished.resolve(),
        secondFinished.reject,
      )
      await new Promise<void>((resolve) => setTimeout(resolve, 500))
      await secondRecorder.stopRecording()
      await withTimeout(secondFinished.promise, 15_000, 'second recording finish')

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('replaces the frame output with one of a different pixel format while running', async () => {
    const device = factory.getDefaultCamera('back')
    if (device == null) return

    const session = await VisionCamera.createCameraSession(false)
    const yuvFrameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'yuv',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })

    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    await session.configure([
      {
        input: device,
        outputs: [{ output: yuvFrameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    // YUV is planar; RGB is not. We use frame.isPlanar to verify the swap
    // actually swung the pipeline over to the new pixel format.
    let yuvIsPlanar: boolean | undefined
    const reportYuv = (planar: boolean) => {
      yuvIsPlanar = planar
    }
    const yuvRuntime = workletsProvider.createRuntimeForThread(yuvFrameOutput.thread)
    yuvRuntime.setOnFrameCallback(yuvFrameOutput, (frame) => {
      'worklet'
      const planar = frame.isPlanar
      scheduleOnRN(reportYuv, planar)
      frame.dispose()
    })

    await session.start()

    try {
      await waitUntil(() => yuvIsPlanar != null || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)
      expect(yuvIsPlanar).toBe(true)

      yuvRuntime.setOnFrameCallback(yuvFrameOutput, undefined)

      const rgbFrameOutput = VisionCamera.createFrameOutput({
        targetResolution: CommonResolutions.VGA_16_9,
        pixelFormat: 'rgb',
        enablePreviewSizedOutputBuffers: false,
        enablePhysicalBufferRotation: false,
        enableCameraMatrixDelivery: false,
        allowDeferredStart: false,
        dropFramesWhileBusy: true,
      })

      await session.configure([
        {
          input: device,
          outputs: [{ output: rgbFrameOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      let rgbIsPlanar: boolean | undefined
      const reportRgb = (planar: boolean) => {
        rgbIsPlanar = planar
      }
      const rgbRuntime = workletsProvider.createRuntimeForThread(
        rgbFrameOutput.thread,
      )
      rgbRuntime.setOnFrameCallback(rgbFrameOutput, (frame) => {
        'worklet'
        const planar = frame.isPlanar
        scheduleOnRN(reportRgb, planar)
        frame.dispose()
      })

      try {
        await waitUntil(() => rgbIsPlanar != null || sessionError != null, {
          timeout: 15_000,
        })
        expect(sessionError).toBe(undefined)
        expect(rgbIsPlanar).toBe(false)
      } finally {
        rgbRuntime.setOnFrameCallback(rgbFrameOutput, undefined)
      }
    } finally {
      errorSub.remove()
      await session.stop()
    }
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

    const started = deferred()
    const sub = session.addOnStartedListener(started.resolve)
    const errorSub = session.addOnErrorListener(started.reject)
    try {
      await session.start()
      await withTimeout(started.promise, 15_000, 'session start')
      await session.stop()
    } finally {
      sub.remove()
      errorSub.remove()
    }
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

      const started = deferred()
      const sub = session.addOnStartedListener(started.resolve)
      const errorSub = session.addOnErrorListener(started.reject)
      try {
        await session.start()
        await withTimeout(started.promise, 15_000, 'session start')
        await session.stop()
      } finally {
        sub.remove()
        errorSub.remove()
      }

      const description = combination
        .map((d) => `${d.position}:${d.id}`)
        .join(', ')
      console.log(`multi-cam session ok: [${description}]`)
    }
  })
})
