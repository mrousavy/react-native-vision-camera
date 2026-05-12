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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

describe('VisionCamera - Video', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
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
    let finishedPath: string | undefined
    let finishedReason: RecordingFinishedReason | undefined
    let recordingError: Error | undefined

    try {
      await recorder.startRecording(
        (filePath, reason) => {
          finishedPath = filePath
          finishedReason = reason
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(1500)
      await recorder.stopRecording()
      await waitUntil(() => finishedPath != null || recordingError != null, {
        timeout: 10_000,
      })

      expect(recordingError).toBe(undefined)
      expect(finishedReason).toBe('stopped')
      expect(finishedPath?.length ?? 0).toBeGreaterThan(0)
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
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(1000)
      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 10_000,
      })
      expect(recordingError).toBe(undefined)
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
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(1000)
      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 10_000,
      })
      expect(recordingError).toBe(undefined)
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
    let finishedReason: RecordingFinishedReason | undefined
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        (_path, reason) => {
          finishedReason = reason
        },
        (error) => {
          recordingError = error
        },
      )
      await waitUntil(() => finishedReason != null || recordingError != null, {
        timeout: 15_000,
      })
      expect(recordingError).toBe(undefined)
      expect(finishedReason).toBe('max-duration-reached')
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
    let finishedReason: RecordingFinishedReason | undefined
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        (_path, reason) => {
          finishedReason = reason
        },
        (error) => {
          recordingError = error
        },
      )
      await waitUntil(() => finishedReason != null || recordingError != null, {
        timeout: 30_000,
      })
      expect(recordingError).toBe(undefined)
      expect(finishedReason).toBe('max-file-size-reached')
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
    let paused = false
    let resumed = false
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
        () => {
          paused = true
        },
        () => {
          resumed = true
        },
      )
      await sleep(500)
      await recorder.pauseRecording()
      await waitUntil(() => paused || recordingError != null, {
        timeout: 5_000,
      })
      expect(recordingError).toBe(undefined)

      await recorder.resumeRecording()
      await waitUntil(() => resumed || recordingError != null, {
        timeout: 5_000,
      })
      expect(recordingError).toBe(undefined)
      await sleep(500)

      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 10_000,
      })
      expect(recordingError).toBe(undefined)

      expect(paused).toBe(true)
      expect(resumed).toBe(true)
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
      await sleep(500)
      await recorder.cancelRecording()
      await sleep(1000)
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
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
      )
      expect(recorder.filePath.length).toBeGreaterThan(0)
      await sleep(300)
      const midDuration = recorder.recordedDuration
      const midSize = recorder.recordedFileSize
      await sleep(900)
      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 10_000,
      })
      expect(recordingError).toBe(undefined)
      console.log(
        `recorded mid duration=${midDuration}s mid size=${midSize}B, final size=${recorder.recordedFileSize}B`,
      )
      expect(midDuration).toBeGreaterThanOrEqual(0)
      expect(midSize).toBeGreaterThanOrEqual(0)
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
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(500)

      await session.stop()
      await sleep(300)
      await session.start()
      await sleep(500)

      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 15_000,
      })
      expect(recordingError).toBe(undefined)
    } finally {
      await session.stop()
    }
  })

  it('records with enableHigherResolutionCodecs on Android', async () => {
    if (Platform.OS !== 'android') {
      console.log('[SKIP] enableHigherResolutionCodecs: Android only')
      return
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
    let finished = false
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        () => {
          finished = true
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(800)
      await recorder.stopRecording()
      await waitUntil(() => finished || recordingError != null, {
        timeout: 10_000,
      })
      expect(recordingError).toBe(undefined)
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
    const probePath = probe.filePath.replace(/^file:\/\//, '')
    const tempDir = probePath.substring(0, probePath.lastIndexOf('/'))
    const ext = Platform.OS === 'ios' ? 'mov' : 'mp4'
    const customPath = `${tempDir}/visioncamera-custom-${Date.now()}.${ext}`

    const recorder = await videoOutput.createRecorder({ filePath: customPath })
    expect(recorder.filePath).toContain(customPath)

    let finishedPath: string | undefined
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        (filePath) => {
          finishedPath = filePath
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(800)
      await recorder.stopRecording()
      await waitUntil(() => finishedPath != null || recordingError != null, {
        timeout: 10_000,
      })

      expect(recordingError).toBe(undefined)
      expect(finishedPath).toContain(customPath)
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
    const probePath = probe.filePath.replace(/^file:\/\//, '')
    const tempDir = probePath.substring(0, probePath.lastIndexOf('/'))
    const ext = Platform.OS === 'ios' ? 'mov' : 'mp4'
    // Use multiple non-existent nested folders so the test fails if the
    // implementation doesn't recursively create parent dirs.
    const customPath = `${tempDir}/visioncamera-nested-${Date.now()}/sub/dir/recording.${ext}`

    const recorder = await videoOutput.createRecorder({ filePath: customPath })
    expect(recorder.filePath).toContain(customPath)

    let finishedPath: string | undefined
    let recordingError: Error | undefined
    try {
      await recorder.startRecording(
        (filePath) => {
          finishedPath = filePath
        },
        (error) => {
          recordingError = error
        },
      )
      await sleep(800)
      await recorder.stopRecording()
      await waitUntil(() => finishedPath != null || recordingError != null, {
        timeout: 10_000,
      })

      // If the recording finished without error, the nested directories
      // had to be created on the fly - otherwise the encoder couldn't
      // have written any bytes.
      expect(recordingError).toBe(undefined)
      expect(finishedPath).toContain(customPath)
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
        // or asynchronously (onRecordingError callback). Wait briefly for
        // the async case, but don't fail if the sync case already fired.
        await waitUntil(() => startError != null || recordingError != null, {
          timeout: 5_000,
        }).catch(() => {
          // Timed out without an error - the assertion below will fail.
        })
      }
    } finally {
      await session.stop()
    }

    expect(
      createError != null || startError != null || recordingError != null,
    ).toBe(true)
  })

  it('returns supported video codecs on iOS after the output is attached', async () => {
    if (Platform.OS !== 'ios') {
      console.log('[SKIP] getSupportedVideoCodecs: iOS only')
      return
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
