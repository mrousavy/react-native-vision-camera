import {
  beforeAll,
  describe,
  expect,
  it,
  waitUntil,
} from 'react-native-harness'
import { Platform } from 'react-native'
import type {
  CameraDeviceFactory,
  TargetCameraPosition,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

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

  it('configures a session directly from each target camera position', async () => {
    const positions: TargetCameraPosition[] = ['back', 'front', 'external']
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const photoOutput = VisionCamera.createPhotoOutput({
      containerFormat: 'native',
      quality: 1,
      qualityPrioritization: 'balanced',
      targetResolution: CommonResolutions.HD_4_3,
    })

    try {
      for (const position of positions) {
        const hasDeviceAtPosition = factory.cameraDevices.some(
          (device) => device.position === position,
        )
        const configurePromise = session.configure([
          {
            input: position,
            outputs: [
              {
                output: previewOutput,
                mirrorMode: position === 'front' ? 'on' : 'auto',
              },
              { output: photoOutput, mirrorMode: 'auto' },
            ],
            constraints: [],
          },
        ])

        if (!hasDeviceAtPosition) {
          await expect(configurePromise).rejects.toThrow()
          continue
        }

        const controllers = await configurePromise
        expect(controllers).toHaveLength(1)
        expect(controllers[0]?.device.position).toBe(position)
      }
    } finally {
      await session.stop()
    }
  })

  it('fires onStarted/onStopped exactly once per lifecycle', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
    subscription.remove()
    await session.stop()
  })

  it('registers interruption listeners without throwing', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const a = session.addOnInterruptionStartedListener(() => {})
    const b = session.addOnInterruptionEndedListener(() => {})
    a.remove()
    b.remove()
    await session.stop()
  })

  it('reconfigures a running session with a new output set', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
    expect(controllers).toHaveLength(1)

    await session.stop()
  })

  it('replaces the photo output with one of a different config while running', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
      await sleep(500)
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
      await sleep(500)
      await secondRecorder.stopRecording()
      await withTimeout(
        secondFinished.promise,
        15_000,
        'second recording finish',
      )

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('replaces the frame output with one of a different pixel format while running', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

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
    const yuvRuntime = workletsProvider.createRuntimeForThread(
      yuvFrameOutput.thread,
    )
    yuvRuntime.setOnFrameCallback(yuvFrameOutput, (frame) => {
      'worklet'
      scheduleOnRN(reportYuv, frame.isPlanar)
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
        scheduleOnRN(reportRgb, frame.isPlanar)
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

  it('switches a running session to a different camera device', async (context) => {
    const backDevice = factory.getDefaultCamera('back')
    expect(backDevice).toBeDefined()
    if (backDevice == null) throw new Error('no back camera')
    const frontDevice = factory.getDefaultCamera('front')
    if (frontDevice == null) {
      return context.skip('device switch: no front camera on this device')
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
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
        input: backDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    try {
      // Reconfiguring to a different device removes the back camera input from
      // the running session and adds the front camera input in a single
      // configure call.
      const controllers = await session.configure([
        {
          input: frontDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      expect(controllers).toHaveLength(1)
      expect(controllers[0]?.device.position).toBe('front')

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('removes multiple outputs from a running session in a single reconfigure', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const firstPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
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
        outputs: [
          { output: previewOutput, mirrorMode: 'auto' },
          { output: firstPhotoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])
    await session.start()

    try {
      // Dropping the preview, photo and video outputs at once removes multiple
      // outputs (and the preview connection) from the running session in a
      // single configure call.
      const secondPhotoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      await session.configure([
        {
          input: device,
          outputs: [{ output: secondPhotoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const photo = await secondPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('removes the camera and audio inputs in a single reconfigure while running', async (context) => {
    const backDevice = factory.getDefaultCamera('back')
    expect(backDevice).toBeDefined()
    if (backDevice == null) throw new Error('no back camera')
    const frontDevice = factory.getDefaultCamera('front')
    if (frontDevice == null) {
      return context.skip('input removal: no front camera on this device')
    }
    await VisionCamera.requestMicrophonePermission()
    if (VisionCamera.microphonePermissionStatus !== 'authorized') {
      return context.skip('input removal: no microphone permission')
    }

    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: true,
    })

    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    try {
      // Switching to the front camera without audio removes both the back
      // camera input and the microphone input in a single configure call.
      const photoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      const controllers = await session.configure([
        {
          input: frontDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      expect(controllers).toHaveLength(1)
      expect(controllers[0]?.device.position).toBe('front')

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('tears down a running session with configure([]) and reconfigures it afterwards', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
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
        outputs: [
          { output: previewOutput, mirrorMode: 'auto' },
          { output: firstPhotoOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])
    await session.start()

    try {
      // This is the `useCameraSession` unmount path: a single configure([])
      // on a running session that removes the input, all outputs and all
      // connections at once.
      const controllers = await session.configure([])
      expect(controllers).toHaveLength(0)
      expect(sessionError).toBe(undefined)

      // The same session must be fully usable again afterwards.
      const secondPhotoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.HD_4_3,
        containerFormat: 'jpeg',
        quality: 0.8,
        qualityPrioritization: 'balanced',
      })
      await session.configure([
        {
          input: device,
          outputs: [{ output: secondPhotoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await session.start()

      const photo = await secondPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()

      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('supports a multi-cam session when the platform allows it', async (context) => {
    if (!VisionCamera.supportsMultiCamSessions) {
      return context.skip('multi-cam session: not supported on this platform')
    }
    const combination = factory.supportedMultiCamDeviceCombinations.find(
      (devices) => devices.length >= 2,
    )
    if (combination == null) {
      return context.skip(
        'multi-cam session: no multi-device combination reported on this device',
      )
    }

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
    expect(controllers).toHaveLength(combination.length)
    const controllerDeviceIds = controllers.map(
      (controller) => controller.device.id,
    )
    const expectedDeviceIds = combination.map((device) => device.id)
    expect(controllerDeviceIds).toEqual(expectedDeviceIds)

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

  it('configures a multi-cam session for every supported device combination', async (context) => {
    if (!VisionCamera.supportsMultiCamSessions) {
      return context.skip(
        'multi-cam combinations: not supported on this platform',
      )
    }
    const combinations = factory.supportedMultiCamDeviceCombinations
    if (combinations.length === 0) {
      return context.skip(
        'multi-cam combinations: no combinations reported on this device',
      )
    }

    const session = await VisionCamera.createCameraSession(true)
    try {
      // Starting every reported combination is expensive on physical devices.
      // The previous test covers actual lifecycle; this one covers the full
      // configure-time compatibility surface.
      for (const combination of combinations) {
        // iOS can report a singleton virtual camera (for example a Dual- or
        // Triple-Camera) as a supported multi-cam device set.
        expect(combination.length).toBeGreaterThan(0)
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
        const controllerDeviceIds = controllers.map(
          (controller) => controller.device.id,
        )
        const expectedDeviceIds = combination.map((device) => device.id)
        expect(controllerDeviceIds).toEqual(expectedDeviceIds)

        const description = combination
          .map((device) => `${device.position}:${device.id}`)
          .join(', ')
        console.log(`multi-cam combination configured: [${description}]`)
      }
    } finally {
      await session.stop()
      await session.configure([])
    }
  })

  it('re-uses the same outputs across re-created sessions (#3773)', async () => {
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

    // Outputs are created ONCE and re-used across all sessions - exactly like
    // hook-created outputs surviving a <Camera> re-mount (e.g. a review screen
    // that unmounts the Camera and re-mounts it on "Retake").
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const outputs = [
      { output: photoOutput, mirrorMode: 'auto' as const },
      { output: videoOutput, mirrorMode: 'auto' as const },
    ]

    // Cycle quickly: each iteration tears its session down exactly like
    // `useCameraSession`'s unmount cleanup does (fire-and-forget stop +
    // configure([]) + dispose), and the next iteration immediately attaches
    // the same outputs to a brand-new session. The dispose() is what makes
    // this safe: releasing the native session detaches its outputs at the
    // CoreMedia level synchronously, before the next session's configure runs
    // on the same native queue. Without it, the outputs could still be
    // attached to the previous session at the CoreMedia level, which crashes
    // in `attachToFigCaptureSession:` with a SIGABRT assertion (#3773).
    for (let i = 0; i < 8; i++) {
      const session = await VisionCamera.createCameraSession(false)
      const started = deferred()
      const startSub = session.addOnStartedListener(started.resolve)
      const errorSub = session.addOnErrorListener(started.reject)
      try {
        await session.configure([{ input: device, outputs, constraints: [] }])
        await session.start()
        // Wait until the outputs are actually attached & streaming before
        // tearing down - a stale attachment needs a live session to exist.
        await withTimeout(started.promise, 10_000, `session #${i} start`)
      } finally {
        startSub.remove()
        errorSub.remove()
        session.stop().catch(() => {})
        session.configure([]).catch(() => {})
        session.dispose()
      }
    }

    // After all those cross-session moves, the outputs must still be fully
    // functional: configure them into one final session and take a photo.
    const session = await VisionCamera.createCameraSession(false)
    const started = deferred()
    const startSub = session.addOnStartedListener(started.resolve)
    const errorSub = session.addOnErrorListener(started.reject)
    try {
      await session.configure([{ input: device, outputs, constraints: [] }])
      await session.start()
      await withTimeout(started.promise, 10_000, 'final session start')

      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()
    } finally {
      startSub.remove()
      errorSub.remove()
      await session.stop()
      await session.configure([])
    }
  })

  it('rejects re-using outputs while their previous session is still alive (iOS)', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'output re-use guard: AVFoundation-specific, iOS only',
      )
    }
    const device = factory.getDefaultCamera('back')
    expect(device).toBeDefined()
    if (device == null) throw new Error('no back camera')

    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    // Attach the output to session A...
    const sessionA = await VisionCamera.createCameraSession(false)
    await sessionA.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    // ...then try to attach the same output to session B while A is still
    // alive. AVFoundation detaches outputs asynchronously, so this is not
    // provably safe and must fail deterministically instead of racing.
    const sessionB = await VisionCamera.createCameraSession(false)
    await expect(
      sessionB.configure([
        {
          input: device,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ]),
    ).rejects.toThrow()

    // Once A is released, its native teardown has detached the output
    // synchronously - now B may use it.
    await sessionA.configure([])
    sessionA.dispose()
    const controllers = await sessionB.configure([
      {
        input: device,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    expect(controllers).toHaveLength(1)

    try {
      await sessionB.start()
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      photo.dispose()
    } finally {
      await sessionB.stop()
    }
  })
})
