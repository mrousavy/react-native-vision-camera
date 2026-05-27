import { Platform } from 'react-native'
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
  Recorder,
  RecordingFinishedReason,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { deferred, withTimeout } from './test-utils'

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

describe('VisionCamera - Video', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    await VisionCamera.requestMicrophonePermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  it('records a short clip and finishes with reason "stopped"', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    // File paths must start with "/" and end with ".mov" or ".mp4".
    expect(recorder.filePath).toMatch(/^\/.*\.(mov|mp4)$/)
    const finished = deferred<{
      path: string
      reason: RecordingFinishedReason
    }>()

    try {
      await recorder.startRecording(
        (path, reason) => finished.resolve({ path, reason }),
        finished.reject,
      )
      await sleep(1_000)
      await recorder.stopRecording()
      const result = await withTimeout(finished.promise, 10_000, 'finish')

      expect(result.reason).toBe('stopped')
      expect(result.path.length).toBeGreaterThan(0)
      // File paths must start with "/" and end with ".mov" or ".mp4".
      expect(result.path).toMatch(/^\/.*\.(mov|mp4)$/)
    } finally {
      await session.stop()
    }
  })

  it('records with audio enabled', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      await sleep(500)
      await recorder.stopRecording()
      await withTimeout(finished.promise, 10_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('applies a custom targetBitRate', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      targetBitRate: 2_000_000,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      await sleep(500)
      await recorder.stopRecording()
      await withTimeout(finished.promise, 10_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('stops automatically when maxDuration is reached', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({ maxDuration: 1 })
    const finished = deferred<RecordingFinishedReason>()
    try {
      await recorder.startRecording(
        (_path, reason) => finished.resolve(reason),
        finished.reject,
      )
      const reason = await withTimeout(finished.promise, 15_000, 'maxDuration')
      expect(reason).toBe('max-duration-reached')
    } finally {
      await session.stop()
    }
  })

  it('stops automatically when maxFileSize is reached', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      targetBitRate: 8_000_000,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    // Limit is above per-GOP / moov-atom overhead so the OS doesn't silently
    // ignore it. At 720p HEVC even a near-static feed produces >=200 kbps
    // from sensor noise, so 500 KB lands well within 30 s on real hardware -
    // a longer timeout would just hide a real bug.
    const recorder = await videoOutput.createRecorder({ maxFileSize: 500_000 })
    const finished = deferred<RecordingFinishedReason>()
    try {
      await recorder.startRecording(
        (_path, reason) => finished.resolve(reason),
        finished.reject,
      )
      const reason = await withTimeout(finished.promise, 30_000, 'maxFileSize')
      expect(reason).toBe('max-file-size-reached')
    } finally {
      await session.stop()
    }
  })

  it('pauses and resumes a recording', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    const paused = deferred()
    const resumed = deferred()
    const finished = deferred()
    try {
      await recorder.startRecording(
        () => finished.resolve(),
        (error) => {
          // Any recording error must abort whichever wait is active.
          paused.reject(error)
          resumed.reject(error)
          finished.reject(error)
        },
        () => paused.resolve(),
        () => resumed.resolve(),
      )
      await sleep(300)
      await recorder.pauseRecording()
      await withTimeout(paused.promise, 5_000, 'pause')

      await recorder.resumeRecording()
      await withTimeout(resumed.promise, 5_000, 'resume')
      await sleep(300)

      await recorder.stopRecording()
      await withTimeout(finished.promise, 10_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('cancels a recording and does not fire onRecordingFinished', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    let finishedCount = 0
    let errorCount = 0
    try {
      await recorder.startRecording(
        () => {
          finishedCount++
        },
        () => {
          errorCount++
        },
      )
      await sleep(300)
      await recorder.cancelRecording()
      await sleep(500)
      expect(finishedCount).toBe(0)
      expect(errorCount).toBe(0)
    } finally {
      await session.stop()
    }
  })

  it('reports growing recordedDuration and recordedFileSize while recording', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      expect(recorder.filePath.length).toBeGreaterThan(0)
      await waitUntil(
        () => recorder.recordedDuration > 0 && recorder.recordedFileSize > 0,
        { timeout: 10_000 },
      )
      const midDuration = recorder.recordedDuration
      const midSize = recorder.recordedFileSize
      await recorder.stopRecording()
      await withTimeout(finished.promise, 10_000, 'finish')
      console.log(
        `recorded mid duration=${midDuration}s mid size=${midSize}B, final size=${recorder.recordedFileSize}B`,
      )
      expect(midDuration).toBeGreaterThan(0)
      expect(midSize).toBeGreaterThan(0)
    } finally {
      await session.stop()
    }
  })

  it('records with a persistent recorder across a session stop/start cycle', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      await sleep(500)

      await session.stop()
      await session.start()
      await sleep(500)

      await recorder.stopRecording()
      await withTimeout(finished.promise, 15_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('keeps a persistent recording running while switching the input device', async (context) => {
    const frontDevice = factory.getDefaultCamera('front')
    if (frontDevice == null) {
      context.skip('persistent recorder device switch: no front camera available')
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })

    // 1. Configure with the back camera
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      // 2. Start recording on the back camera
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      await sleep(500)

      // 3. Reconfigure the running session with the front camera — the
      //    persistent recorder must keep running across the input switch.
      await session.configure([
        {
          input: frontDevice,
          outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await sleep(500)

      // 4. Stop the recording — the file should contain footage from both cameras.
      await recorder.stopRecording()
      await withTimeout(finished.promise, 15_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('records with enableHigherResolutionCodecs on Android', async (context) => {
    if (Platform.OS !== 'android') {
      context.skip('enableHigherResolutionCodecs: Android only')
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.FHD_16_9,
      enableAudio: false,
      enableHigherResolutionCodecs: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()
    const recorder = await videoOutput.createRecorder({})
    const finished = deferred()
    try {
      await recorder.startRecording(() => finished.resolve(), finished.reject)
      await sleep(500)
      await recorder.stopRecording()
      await withTimeout(finished.promise, 10_000, 'finish')
    } finally {
      await session.stop()
    }
  })

  it('records to a custom file path', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    // Discover the platform-specific app-writable temp directory by
    // creating a default recorder and reading its chosen file path.
    // We can't hard-code `/tmp/...` because iOS app sandboxes and Android
    // app contexts both use platform-specific dynamic paths.
    const probe = await videoOutput.createRecorder({})
    const probePath = probe.filePath
    const tempDir = probePath.substring(0, probePath.lastIndexOf('/'))
    const ext = Platform.OS === 'ios' ? 'mov' : 'mp4'
    const customPath = `${tempDir}/visioncamera-custom-${Date.now()}.${ext}`

    const recorder = await videoOutput.createRecorder({ filePath: customPath })
    expect(recorder.filePath).toContain(customPath)

    const finished = deferred<string>()
    try {
      await recorder.startRecording(
        (filePath) => finished.resolve(filePath),
        finished.reject,
      )
      await sleep(500)
      await recorder.stopRecording()
      const path = await withTimeout(finished.promise, 10_000, 'finish')

      expect(path).toContain(customPath)
    } finally {
      await session.stop()
    }
  })

  it('auto-creates parent directories for a nested custom file path', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    const probe = await videoOutput.createRecorder({})
    const probePath = probe.filePath
    const tempDir = probePath.substring(0, probePath.lastIndexOf('/'))
    const ext = Platform.OS === 'ios' ? 'mov' : 'mp4'
    // Use multiple non-existent nested folders so the test fails if the
    // implementation doesn't recursively create parent dirs.
    const customPath = `${tempDir}/visioncamera-nested-${Date.now()}/sub/dir/recording.${ext}`

    const recorder = await videoOutput.createRecorder({ filePath: customPath })
    expect(recorder.filePath).toContain(customPath)

    const finished = deferred<string>()
    try {
      await recorder.startRecording(
        (filePath) => finished.resolve(filePath),
        finished.reject,
      )
      await sleep(500)
      await recorder.stopRecording()
      // If the recording finishes without error, the nested directories
      // had to be created on the fly - otherwise the encoder couldn't
      // have written any bytes.
      const path = await withTimeout(finished.promise, 10_000, 'finish')
      expect(path).toContain(customPath)
    } finally {
      await session.stop()
    }
  })

  it('fails to record when given an unwritable file path', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    await session.start()

    // The filesystem root is read-only inside both iOS and Android app
    // sandboxes, so writing to `/<file>.mp4` must fail somehow.
    const invalidPath = `/visioncamera-cannot-write-${Date.now()}.mp4`
    let createError: Error | undefined
    let startError: Error | undefined
    let recordingError: Error | undefined

    try {
      let recorder: Recorder | undefined
      try {
        recorder = await videoOutput.createRecorder({ filePath: invalidPath })
      } catch (e) {
        createError = e as Error
      }
      if (recorder != null) {
        try {
          await recorder.startRecording(
            () => {},
            (error) => {
              recordingError = error
            },
          )
        } catch (e) {
          startError = e as Error
        }
        // The error may surface synchronously (startRecording rejection)
        // or asynchronously (onRecordingError callback).
        await waitUntil(() => startError != null || recordingError != null, {
          timeout: 5_000,
        })
      }
    } finally {
      await session.stop()
    }

    const recordingFailure = createError ?? startError ?? recordingError
    expect(recordingFailure).toBeDefined()
  })

  // Verifies that `targetResolution` actually drives the video pipeline.
  // We can't introspect the captured MP4's dimensions from JS today, so the
  // best signal is `videoOutput.currentResolution` once the output has been
  // bound to the configured session.
  it("records at the device's maximum supported video resolution", async () => {
    const supported = backDevice.getSupportedResolutions('video')
    expect(supported.length).toBeGreaterThan(0)
    const max = supported.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: max,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: videoOutput }],
      },
    ])
    await session.start()
    try {
      // iOS only populates the connection's format description once the
      // session is actually streaming, so wait briefly.
      await waitUntil(() => videoOutput.currentResolution != null, {
        timeout: 10_000,
      })

      const reported = videoOutput.currentResolution
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported video resolution')

      const requestedShortEdge = Math.min(max.width, max.height)
      const requestedLongEdge = Math.max(max.width, max.height)
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      console.log(
        `max device video res=${max.width}x${max.height} reported=${reported.width}x${reported.height}`,
      )
      expect(reportedShortEdge).toBe(requestedShortEdge)
      expect(reportedLongEdge).toBe(requestedLongEdge)
    } finally {
      await session.stop()
    }
  })

  it("records at the device's minimum supported video resolution", async () => {
    const supported = backDevice.getSupportedResolutions('video')
    expect(supported.length).toBeGreaterThan(0)
    const min = supported.reduce((a, b) =>
      a.width * a.height < b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: min,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: videoOutput }],
      },
    ])
    await session.start()
    try {
      await waitUntil(() => videoOutput.currentResolution != null, {
        timeout: 10_000,
      })

      const reported = videoOutput.currentResolution
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported video resolution')

      const requestedShortEdge = Math.min(min.width, min.height)
      const requestedLongEdge = Math.max(min.width, min.height)
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      console.log(
        `min device video res=${min.width}x${min.height} reported=${reported.width}x${reported.height}`,
      )
      expect(reportedShortEdge).toBe(requestedShortEdge)
      expect(reportedLongEdge).toBe(requestedLongEdge)
    } finally {
      await session.stop()
    }
  })

  it('returns supported video codecs on iOS after the output is attached', async (context) => {
    if (Platform.OS !== 'ios') {
      context.skip('getSupportedVideoCodecs: iOS only')
    }
    const session = await VisionCamera.createCameraSession(false)
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: videoOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    const codecs = videoOutput.getSupportedVideoCodecs()
    expect(codecs.length).toBeGreaterThan(0)
    console.log(`supported video codecs: ${codecs.join(', ')}`)
    await session.stop()
  })
})
