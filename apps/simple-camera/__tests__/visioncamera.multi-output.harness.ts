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
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

describe('VisionCamera - Multi-Output', () => {
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

  it('configures photo + video + frame outputs in a single session', async () => {
    const session = await VisionCamera.createCameraSession(false)
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
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'native',
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
        input: backDevice,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])
    await session.start()
    try {
      expect(sessionError).toBe(undefined)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('streams frames, captures a photo, and records video simultaneously', async () => {
    const session = await VisionCamera.createCameraSession(false)
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
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'native',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })

    await session.configure([
      {
        input: backDevice,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])

    let framesReceived = 0
    let sessionError: Error | undefined
    const onFrameReceived = () => {
      framesReceived++
    }
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(onFrameReceived)
      frame.dispose()
    })

    await session.start()
    try {
      // Wait for the frame pipeline to start.
      await waitUntil(() => framesReceived >= 1 || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)

      // Start recording while frames are still streaming.
      const recorder = await videoOutput.createRecorder({})
      const finished = deferred()
      await recorder.startRecording(() => finished.resolve(), finished.reject)

      // Capture a photo while video is being recorded and frames are still streaming.
      const framesAtPhoto = framesReceived
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      photo.dispose()

      // Frames must keep arriving after the photo capture completes —
      // photo capture must not permanently stall the frame pipeline.
      await waitUntil(
        () => framesReceived > framesAtPhoto + 2 || sessionError != null,
        { timeout: 15_000 },
      )
      expect(sessionError).toBe(undefined)
      expect(framesReceived).toBeGreaterThan(framesAtPhoto)

      await recorder.stopRecording()
      await withTimeout(finished.promise, 15_000, 'finish')
      expect(sessionError).toBe(undefined)
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  it('keeps a persistent recording running across a session restart with photo + frame outputs attached', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const videoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
      enablePersistentRecorder: true,
    })
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'native',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })

    await session.configure([
      {
        input: backDevice,
        outputs: [
          { output: photoOutput, mirrorMode: 'auto' },
          { output: videoOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
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

  it('sequentially replaces photo, video, and frame outputs without disrupting untouched outputs', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const firstPhotoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const firstVideoOutput = VisionCamera.createVideoOutput({
      targetResolution: CommonResolutions.HD_16_9,
      enableAudio: false,
    })
    const yuvFrameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'yuv',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })

    let yuvFramesReceived = 0
    let yuvIsPlanar: boolean | undefined
    let sessionError: Error | undefined
    const reportYuvFrame = (isPlanar: boolean) => {
      yuvFramesReceived++
      yuvIsPlanar = isPlanar
    }
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    await session.configure([
      {
        input: backDevice,
        outputs: [
          { output: firstPhotoOutput, mirrorMode: 'auto' },
          { output: firstVideoOutput, mirrorMode: 'auto' },
          { output: yuvFrameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])

    const yuvRuntime = workletsProvider.createRuntimeForThread(
      yuvFrameOutput.thread,
    )
    yuvRuntime.setOnFrameCallback(yuvFrameOutput, (frame) => {
      'worklet'
      scheduleOnRN(reportYuvFrame, frame.isPlanar)
      frame.dispose()
    })

    await session.start()

    try {
      await waitUntil(() => yuvIsPlanar != null || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)
      expect(yuvIsPlanar).toBe(true)

      const waitForMoreYuvFrames = async () => {
        const framesBefore = yuvFramesReceived
        await waitUntil(
          () => yuvFramesReceived > framesBefore + 2 || sessionError != null,
          { timeout: 15_000 },
        )
        expect(sessionError).toBe(undefined)
        expect(yuvFramesReceived).toBeGreaterThan(framesBefore)
      }

      const secondPhotoOutput = VisionCamera.createPhotoOutput({
        targetResolution: CommonResolutions.FHD_4_3,
        containerFormat: 'jpeg',
        quality: 0.5,
        qualityPrioritization: 'quality',
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [
            { output: secondPhotoOutput, mirrorMode: 'auto' },
            { output: firstVideoOutput, mirrorMode: 'auto' },
            { output: yuvFrameOutput, mirrorMode: 'auto' },
          ],
          constraints: [],
        },
      ])

      const photoAfterPhotoReplacement = await secondPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photoAfterPhotoReplacement.width).toBeGreaterThan(0)
      expect(photoAfterPhotoReplacement.height).toBeGreaterThan(0)
      photoAfterPhotoReplacement.dispose()

      const firstRecorder = await firstVideoOutput.createRecorder({})
      const firstRecordingFinished = deferred()
      await firstRecorder.startRecording(
        () => firstRecordingFinished.resolve(),
        firstRecordingFinished.reject,
      )
      await sleep(500)
      await firstRecorder.stopRecording()
      await withTimeout(
        firstRecordingFinished.promise,
        15_000,
        'recording after photo replacement',
      )
      await waitForMoreYuvFrames()

      const secondVideoOutput = VisionCamera.createVideoOutput({
        targetResolution: CommonResolutions.FHD_16_9,
        enableAudio: false,
      })
      await session.configure([
        {
          input: backDevice,
          outputs: [
            { output: secondPhotoOutput, mirrorMode: 'auto' },
            { output: secondVideoOutput, mirrorMode: 'auto' },
            { output: yuvFrameOutput, mirrorMode: 'auto' },
          ],
          constraints: [],
        },
      ])

      const photoAfterVideoReplacement = await secondPhotoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      )
      expect(photoAfterVideoReplacement.width).toBeGreaterThan(0)
      expect(photoAfterVideoReplacement.height).toBeGreaterThan(0)
      photoAfterVideoReplacement.dispose()

      const recorderAfterVideoReplacement =
        await secondVideoOutput.createRecorder({})
      const recordingAfterVideoReplacement = deferred()
      await recorderAfterVideoReplacement.startRecording(
        () => recordingAfterVideoReplacement.resolve(),
        recordingAfterVideoReplacement.reject,
      )
      await sleep(500)
      await recorderAfterVideoReplacement.stopRecording()
      await withTimeout(
        recordingAfterVideoReplacement.promise,
        15_000,
        'recording after video replacement',
      )
      await waitForMoreYuvFrames()

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
          input: backDevice,
          outputs: [
            { output: secondPhotoOutput, mirrorMode: 'auto' },
            { output: secondVideoOutput, mirrorMode: 'auto' },
            { output: rgbFrameOutput, mirrorMode: 'auto' },
          ],
          constraints: [],
        },
      ])

      let rgbIsPlanar: boolean | undefined
      const reportRgb = (isPlanar: boolean) => {
        rgbIsPlanar = isPlanar
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

        const photoAfterFrameReplacement = await secondPhotoOutput.capturePhoto(
          { flashMode: 'off', enableShutterSound: false },
          {},
        )
        expect(photoAfterFrameReplacement.width).toBeGreaterThan(0)
        expect(photoAfterFrameReplacement.height).toBeGreaterThan(0)
        photoAfterFrameReplacement.dispose()

        const secondRecorder = await secondVideoOutput.createRecorder({})
        const secondRecordingFinished = deferred()
        await secondRecorder.startRecording(
          () => secondRecordingFinished.resolve(),
          secondRecordingFinished.reject,
        )
        await sleep(500)
        await secondRecorder.stopRecording()
        await withTimeout(
          secondRecordingFinished.promise,
          15_000,
          'recording after frame replacement',
        )
        expect(sessionError).toBe(undefined)
      } finally {
        rgbRuntime.setOnFrameCallback(rgbFrameOutput, undefined)
      }
    } finally {
      yuvRuntime.setOnFrameCallback(yuvFrameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })
})
