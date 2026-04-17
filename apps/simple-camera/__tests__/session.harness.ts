import { afterAll, beforeAll, describe, expect, it } from 'react-native-harness'
import {
  type CameraDevice,
  type CameraDeviceFactory,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'

let factory: CameraDeviceFactory
let backDevice: CameraDevice | undefined
let frontDevice: CameraDevice | undefined
let primaryDevice: CameraDevice | undefined

describe('VisionCamera - CameraSession creation', () => {
  it('creates a single-cam CameraSession', async () => {
    const session = await VisionCamera.createCameraSession(false)

    expect(session).toBeDefined()
    expect(session.isRunning).toBe(false)
  })

  it('creates multiple independent single-cam sessions', async () => {
    const first = await VisionCamera.createCameraSession(false)
    const second = await VisionCamera.createCameraSession(false)

    expect(first).not.toBe(second)
    expect(first.isRunning).toBe(false)
    expect(second.isRunning).toBe(false)
  })

  it('creates a multi-cam CameraSession when supported', async () => {
    if (!VisionCamera.supportsMultiCamSessions) {
      console.log('[SKIP] multi-cam session: not supported on this device')
      return
    }

    const session = await VisionCamera.createCameraSession(true)

    expect(session).toBeDefined()
    expect(session.isRunning).toBe(false)
  })

  it('throws when creating a multi-cam session on an unsupported device', async () => {
    if (VisionCamera.supportsMultiCamSessions) {
      console.log('[SKIP] multi-cam throw test: device supports multi-cam')
      return
    }

    let threw = false
    try {
      await VisionCamera.createCameraSession(true)
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
  })
})

describe('VisionCamera - CameraSession configuration', () => {
  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    factory = await VisionCamera.createDeviceFactory()
    primaryDevice =
      factory.getDefaultCamera('back') ??
      factory.getDefaultCamera('front') ??
      factory.cameraDevices[0]
  })

  afterAll(() => {
    primaryDevice = undefined
  })

  it('configures a session with a single photo output', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session configure photo: no camera device available')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)
    expect(controllers[0]?.device.id).toBe(primaryDevice.id)
  })

  it('configures a session with a preview + photo output', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session configure preview+photo: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: primaryDevice,
        outputs: [
          { output: previewOutput, mirrorMode: 'auto' },
          { output: photoOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)
  })

  it('configures a session with photo + video + frame outputs', async () => {
    if (primaryDevice == null) {
      console.log(
        '[SKIP] session configure photo+video+frame: no camera device',
      )
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enablePreviewSizedOutputBuffers: true,
      pixelFormat: 'yuv',
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      dropFramesWhileBusy: true,
      allowDeferredStart: false,
    })

    const controllers = await session.configure([
      {
        input: primaryDevice,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)
  })

  it('configures a session with no outputs', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session configure no outputs: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const controllers = await session.configure([
      {
        input: primaryDevice,
        outputs: [],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(1)
  })

  it('supports reconfiguring a session and returning a new controller', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session reconfigure: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const firstOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    const [firstController] = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: firstOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const secondOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enablePersistentRecorder: false,
    })
    const [secondController] = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: secondOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    expect(firstController).toBeDefined()
    expect(secondController).toBeDefined()
    expect(firstController).not.toBe(secondController)
  })

  it('configures a session with initialZoom and initialExposureBias', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session initial zoom/bias: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.UHD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const [controller] = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
        initialZoom: Math.min(
          Math.max(primaryDevice.minZoom, 1),
          primaryDevice.maxZoom,
        ),
        initialExposureBias: 0,
      },
    ])

    expect(controller).toBeDefined()
  })

  it('calls onSessionConfigSelected after configuring', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] onSessionConfigSelected: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    let receivedConfig = false
    await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
        onSessionConfigSelected: (config) => {
          expect(config).toBeDefined()
          expect(typeof config.nativePixelFormat).toBe('string')
          receivedConfig = true
        },
      },
    ])

    expect(receivedConfig).toBe(true)
  })

  it('supports the allowBackgroundAudioPlayback session config flag on iOS', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] allowBackgroundAudioPlayback: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure(
      [
        {
          input: primaryDevice,
          outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ],
      { allowBackgroundAudioPlayback: true },
    )

    expect(controllers.length).toBe(1)
  })
})

describe('VisionCamera - CameraSession mirror modes', () => {
  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    factory = await VisionCamera.createDeviceFactory()
    primaryDevice =
      factory.getDefaultCamera('back') ??
      factory.getDefaultCamera('front') ??
      factory.cameraDevices[0]
  })

  afterAll(() => {
    primaryDevice = undefined
  })

  it("configures an output with mirrorMode 'on'", async () => {
    if (primaryDevice == null) {
      console.log("[SKIP] mirrorMode 'on': no camera device")
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const [controller] = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'on' }],
        constraints: [],
      },
    ])

    expect(controller).toBeDefined()
  })

  it("configures an output with mirrorMode 'off'", async () => {
    if (primaryDevice == null) {
      console.log("[SKIP] mirrorMode 'off': no camera device")
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    const [controller] = await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'off' }],
        constraints: [],
      },
    ])

    expect(controller).toBeDefined()
  })
})

describe('VisionCamera - CameraSession lifecycle', () => {
  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    factory = await VisionCamera.createDeviceFactory()
    primaryDevice =
      factory.getDefaultCamera('back') ??
      factory.getDefaultCamera('front') ??
      factory.cameraDevices[0]
  })

  afterAll(() => {
    primaryDevice = undefined
  })

  it('starts and stops a configured session', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session lifecycle: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    expect(session.isRunning).toBe(false)
    await session.start()
    expect(session.isRunning).toBe(true)
    await session.stop()
    expect(session.isRunning).toBe(false)
  })

  it('supports starting and stopping the session multiple times', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] session start/stop loop: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })
    await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    for (let i = 0; i < 2; i++) {
      await session.start()
      expect(session.isRunning).toBe(true)
      await session.stop()
      expect(session.isRunning).toBe(false)
    }
  })

  it('fires the onStarted listener when the session starts', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] onStarted listener: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    let onStartedCallCount = 0
    const subscription = session.addOnStartedListener(() => {
      onStartedCallCount++
    })

    await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    await session.stop()

    subscription.remove()
    expect(onStartedCallCount).toBeGreaterThanOrEqual(1)
  })

  it('fires the onStopped listener when the session stops', async () => {
    if (primaryDevice == null) {
      console.log('[SKIP] onStopped listener: no camera device')
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    })

    let onStoppedCallCount = 0
    const subscription = session.addOnStoppedListener(() => {
      onStoppedCallCount++
    })

    await session.configure([
      {
        input: primaryDevice,
        outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    await session.stop()

    subscription.remove()
    expect(onStoppedCallCount).toBeGreaterThanOrEqual(1)
  })

  it('allows attaching and removing error/interruption listeners', async () => {
    const session = await VisionCamera.createCameraSession(false)

    const errorSub = session.addOnErrorListener(() => {
      /* noop */
    })
    const interruptedStartedSub = session.addOnInterruptionStartedListener(
      () => {
        /* noop */
      },
    )
    const interruptedEndedSub = session.addOnInterruptionEndedListener(() => {
      /* noop */
    })

    expect(typeof errorSub.remove).toBe('function')
    expect(typeof interruptedStartedSub.remove).toBe('function')
    expect(typeof interruptedEndedSub.remove).toBe('function')

    errorSub.remove()
    interruptedStartedSub.remove()
    interruptedEndedSub.remove()
  })
})

describe('VisionCamera - Multi-cam CameraSession', () => {
  beforeAll(async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    factory = await VisionCamera.createDeviceFactory()
    backDevice = factory.getDefaultCamera('back')
    frontDevice = factory.getDefaultCamera('front')
  })

  afterAll(() => {
    backDevice = undefined
    frontDevice = undefined
  })

  it('configures a multi-cam session with both front and back cameras', async () => {
    if (!VisionCamera.supportsMultiCamSessions) {
      console.log('[SKIP] multi-cam configure: not supported on this device')
      return
    }

    if (backDevice == null || frontDevice == null) {
      console.log(
        '[SKIP] multi-cam configure: needs both front and back cameras',
      )
      return
    }

    const session = await VisionCamera.createCameraSession(true)
    const frontPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const backPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    const controllers = await session.configure([
      {
        input: frontDevice,
        outputs: [{ output: frontPhoto, mirrorMode: 'on' }],
        constraints: [],
      },
      {
        input: backDevice,
        outputs: [{ output: backPhoto, mirrorMode: 'off' }],
        constraints: [],
      },
    ])

    expect(controllers.length).toBe(2)
    expect(controllers[0]?.device.id).toBe(frontDevice.id)
    expect(controllers[1]?.device.id).toBe(backDevice.id)
  })

  it('rejects adding multiple connections on a single-cam session', async () => {
    if (backDevice == null || frontDevice == null) {
      console.log(
        '[SKIP] single-cam rejects multiple connections: needs both front and back cameras',
      )
      return
    }

    const session = await VisionCamera.createCameraSession(false)
    const frontPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const backPhoto = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'native',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })

    let threw = false
    try {
      await session.configure([
        {
          input: frontDevice,
          outputs: [{ output: frontPhoto, mirrorMode: 'auto' }],
          constraints: [],
        },
        {
          input: backDevice,
          outputs: [{ output: backPhoto, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
  })
})
