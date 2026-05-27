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
  FrameDroppedReason,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

describe('VisionCamera - Frame', () => {
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

  it('delivers frames to a worklet and posts back via scheduleOnRN', async () => {
    const session = await VisionCamera.createCameraSession(false)
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const receivedFrames = deferred()
    let framesReceived = 0
    const onFrameReceived = () => {
      framesReceived++
      if (framesReceived >= 3) {
        receivedFrames.resolve()
      }
    }
    const errorSub = session.addOnErrorListener(receivedFrames.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(onFrameReceived)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(receivedFrames.promise, 15_000, 'receive frames')
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
    expect(framesReceived).toBeGreaterThanOrEqual(3)
  })

  it('gets pixel buffers and releases native buffers from native frames', async () => {
    const session = await VisionCamera.createCameraSession(false)
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const receivedBuffers = deferred()
    let buffersReceived = 0
    const report = (hasPixelBuffer: boolean, hasNativeBuffer: boolean) => {
      if (!hasPixelBuffer) {
        receivedBuffers.reject(new Error('Frame pixel buffer was empty.'))
      } else if (!hasNativeBuffer) {
        receivedBuffers.reject(new Error('Frame native buffer pointer was 0.'))
      } else {
        buffersReceived++
        if (buffersReceived >= 3) {
          receivedBuffers.resolve()
        }
      }
    }
    const reportError = (errorMessage: string) => {
      receivedBuffers.reject(new Error(errorMessage))
    }
    const errorSub = session.addOnErrorListener(receivedBuffers.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      try {
        const pixelBuffer = frame.getPixelBuffer()
        const hasPixelBuffer = pixelBuffer.byteLength > 0
        const nativeBuffer = frame.getNativeBuffer()
        let hasNativeBuffer = false
        try {
          hasNativeBuffer = nativeBuffer.pointer !== 0n
        } finally {
          nativeBuffer.release()
        }
        scheduleOnRN(report, hasPixelBuffer, hasNativeBuffer)
      } catch (e) {
        scheduleOnRN(reportError, String(e))
      } finally {
        frame.dispose()
      }
    })

    await session.start()
    try {
      await withTimeout(
        receivedBuffers.promise,
        15_000,
        'receive native frame pixel buffers',
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
    expect(buffersReceived).toBeGreaterThanOrEqual(3)
  })

  it('keeps YUV plane buffers readable across repeated reads', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'yuv',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    type BufferReport = {
      frameBytes: number
      firstPlaneBytes: number[]
      secondPlaneBytes: number[]
    }
    const receivedBufferReports = deferred<BufferReport[]>()
    const bufferReports: BufferReport[] = []
    const report = (
      frameBytes: number,
      firstPlaneBytes: number[],
      secondPlaneBytes: number[],
    ) => {
      if (bufferReports.length < 3) {
        bufferReports.push({ frameBytes, firstPlaneBytes, secondPlaneBytes })
        if (bufferReports.length >= 3) {
          receivedBufferReports.resolve(bufferReports)
        }
      }
    }
    const reportError = (errorMessage: string) => {
      receivedBufferReports.reject(new Error(errorMessage))
    }
    const errorSub = session.addOnErrorListener(receivedBufferReports.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      try {
        const frameBytes = frame.getPixelBuffer().byteLength
        const planes = frame.getPlanes()
        const firstPlaneBytes = planes.map(
          (plane) => plane.getPixelBuffer().byteLength,
        )
        const secondPlaneBytes = planes.map(
          (plane) => plane.getPixelBuffer().byteLength,
        )
        scheduleOnRN(report, frameBytes, firstPlaneBytes, secondPlaneBytes)
      } catch (e) {
        scheduleOnRN(reportError, String(e))
      } finally {
        frame.dispose()
      }
    })

    await session.start()
    let reports: BufferReport[] = []
    try {
      reports = await withTimeout(
        receivedBufferReports.promise,
        15_000,
        'read YUV frame pixel buffers',
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }

    for (const bufferReport of reports) {
      expect(bufferReport.frameBytes).toBeGreaterThan(0)
      expect(bufferReport.firstPlaneBytes.length).toBeGreaterThan(0)
      expect(bufferReport.firstPlaneBytes).toEqual(
        bufferReport.secondPlaneBytes,
      )
      for (const planeBytes of bufferReport.firstPlaneBytes) {
        expect(planeBytes).toBeGreaterThan(0)
      }
    }
  })

  it('delivers YUV frames with planar access when streaming in yuv', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.HD_16_9,
      pixelFormat: 'yuv',
      enablePreviewSizedOutputBuffers: false,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let reportedWidth = 0
    let reportedHeight = 0
    let reportedPlanes = -1
    const reportedFrame = deferred()
    const report = (w: number, h: number, planes: number) => {
      reportedWidth = w
      reportedHeight = h
      reportedPlanes = planes
      if (reportedWidth > 0 && reportedHeight > 0) {
        reportedFrame.resolve()
      }
    }
    const errorSub = session.addOnErrorListener(reportedFrame.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      const w = frame.width
      const h = frame.height
      let planeCount = 0
      if (frame.isPlanar) {
        const planes = frame.getPlanes()
        planeCount = planes.length
      }
      scheduleOnRN(report, w, h, planeCount)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(reportedFrame.promise, 15_000, 'receive YUV frame')
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
    console.log(
      `yuv frame reported ${reportedWidth}x${reportedHeight} planes=${reportedPlanes}`,
    )
    expect(reportedWidth).toBeGreaterThan(0)
    expect(reportedHeight).toBeGreaterThan(0)
    expect(reportedPlanes).toBeGreaterThanOrEqual(1)
  })

  it('delivers frames when streaming in rgb', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const receivedFrame = deferred()
    const onFrame = () => {
      receivedFrame.resolve()
    }
    const errorSub = session.addOnErrorListener(receivedFrame.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(onFrame)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(receivedFrame.promise, 15_000, 'receive RGB frame')
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  it('synchronizes state from the worklet using createSynchronizable', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.VGA_16_9,
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const counter = createSynchronizable(0)
    const sessionFailed = deferred<never>()
    const errorSub = session.addOnErrorListener(sessionFailed.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      counter.setBlocking((prev) => prev + 1)
      frame.dispose()
    })

    await session.start()
    try {
      await Promise.race([
        waitUntil(() => counter.getBlocking() >= 3, { timeout: 15_000 }),
        sessionFailed.promise,
      ])
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
    expect(counter.getBlocking()).toBeGreaterThanOrEqual(3)
  })

  // Verifies that `targetResolution` actually drives the frame pipeline — the
  // other frame tests only assert width/height > 0, so a regression that
  // snaps every request to a default resolution would slip through.
  it("streams frames at the device's maximum supported frame resolution", async () => {
    const supported = backDevice.getSupportedResolutions('stream')
    expect(supported.length).toBeGreaterThan(0)
    const max = supported.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: max,
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: frameOutput }],
      },
    ])

    let receivedWidth = 0
    let receivedHeight = 0
    const receivedFrame = deferred()
    const report = (w: number, h: number) => {
      receivedWidth = w
      receivedHeight = h
      if (receivedWidth > 0 && receivedHeight > 0) {
        receivedFrame.resolve()
      }
    }
    const errorSub = session.addOnErrorListener(receivedFrame.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(report, frame.width, frame.height)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(
        receivedFrame.promise,
        15_000,
        'receive maximum resolution frame',
      )

      const requestedShortEdge = Math.min(max.width, max.height)
      const requestedLongEdge = Math.max(max.width, max.height)
      const streamedShortEdge = Math.min(receivedWidth, receivedHeight)
      const streamedLongEdge = Math.max(receivedWidth, receivedHeight)

      // currentResolution should match what's actually being streamed.
      const reported = frameOutput.currentResolution
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported frame resolution')
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      expect(reportedShortEdge).toBe(streamedShortEdge)
      expect(reportedLongEdge).toBe(streamedLongEdge)

      console.log(
        `max device stream res=${max.width}x${max.height} reported=${reported.width}x${reported.height} streamed=${receivedWidth}x${receivedHeight}`,
      )
      expect(streamedShortEdge).toBe(requestedShortEdge)
      expect(streamedLongEdge).toBe(requestedLongEdge)
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  it("streams frames at the device's minimum supported frame resolution", async () => {
    const supported = backDevice.getSupportedResolutions('stream')
    expect(supported.length).toBeGreaterThan(0)
    const min = supported.reduce((a, b) =>
      a.width * a.height < b.width * b.height ? a : b,
    )

    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: min,
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [{ resolutionBias: frameOutput }],
      },
    ])

    let receivedWidth = 0
    let receivedHeight = 0
    const receivedFrame = deferred()
    const report = (w: number, h: number) => {
      receivedWidth = w
      receivedHeight = h
      if (receivedWidth > 0 && receivedHeight > 0) {
        receivedFrame.resolve()
      }
    }
    const errorSub = session.addOnErrorListener(receivedFrame.reject)

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(report, frame.width, frame.height)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(
        receivedFrame.promise,
        15_000,
        'receive minimum resolution frame',
      )

      const requestedShortEdge = Math.min(min.width, min.height)
      const requestedLongEdge = Math.max(min.width, min.height)
      const streamedShortEdge = Math.min(receivedWidth, receivedHeight)
      const streamedLongEdge = Math.max(receivedWidth, receivedHeight)

      const reported = frameOutput.currentResolution
      expect(reported).toBeDefined()
      if (reported == null) throw new Error('no reported frame resolution')
      const reportedShortEdge = Math.min(reported.width, reported.height)
      const reportedLongEdge = Math.max(reported.width, reported.height)
      expect(reportedShortEdge).toBe(streamedShortEdge)
      expect(reportedLongEdge).toBe(streamedLongEdge)

      console.log(
        `min device stream res=${min.width}x${min.height} reported=${reported.width}x${reported.height} streamed=${receivedWidth}x${receivedHeight}`,
      )
      expect(streamedShortEdge).toBe(requestedShortEdge)
      expect(streamedLongEdge).toBe(requestedLongEdge)
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  // TODO: Re-enable this test once the Android CameraX ImageAnalysis pipeline surfaces
  //       dropped-frame notifications. Today HybridFrameOutput.setOnFrameDroppedCallback
  //       is a no-op on Android (see the `TODO: CameraX does not have a way to figure
  //       out if a Frame has been dropped` comment in HybridFrameOutput.kt).
  it.skip('invokes the onFrameDropped callback when the worklet stalls', async () => {
    const session = await VisionCamera.createCameraSession(false)
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
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [{ fps: 30 }],
      },
    ])

    let droppedReason: FrameDroppedReason | undefined
    frameOutput.setOnFrameDroppedCallback((reason) => {
      droppedReason = reason
    })

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      const start = Date.now()
      // Deliberately stall so subsequent frames are dropped.
      while (Date.now() - start < 150) {
        // busy wait
      }
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => droppedReason != null, { timeout: 15_000 })
      console.log(`frame dropped reason: ${droppedReason}`)
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      frameOutput.setOnFrameDroppedCallback(undefined)
      await session.stop()
    }
  })

  // TODO: Re-enable once the Android frame output honors `enablePreviewSizedOutputBuffers`
  //       (today HybridFrameOutput.kt / HybridDepthFrameOutput.kt both have a
  //       `TODO: enablePreviewSizedOutputBuffers is not taken into account here.`).
  //       Actually, maybe we should remoev `enablePreviewSizedOutputBuffers` in favor of
  //       the simple, yet more flexible `targetResolution: ...` prop anyways.
  it.skip('delivers smaller buffers when enablePreviewSizedOutputBuffers is true', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.UHD_16_9,
      pixelFormat: 'native',
      enablePreviewSizedOutputBuffers: true,
      enablePhysicalBufferRotation: false,
      enableCameraMatrixDelivery: false,
      allowDeferredStart: false,
      dropFramesWhileBusy: true,
    })
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let reportedWidth = 0
    let reportedHeight = 0
    const report = (w: number, h: number) => {
      reportedWidth = w
      reportedHeight = h
    }

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      scheduleOnRN(report, frame.width, frame.height)
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => reportedWidth > 0 && reportedHeight > 0, {
        timeout: 15_000,
      })
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      await session.stop()
    }
    console.log(
      `preview-sized frame: ${reportedWidth}x${reportedHeight} (requested target ${CommonResolutions.UHD_16_9.width}x${CommonResolutions.UHD_16_9.height})`,
    )
    const requestedPixels =
      CommonResolutions.UHD_16_9.width * CommonResolutions.UHD_16_9.height
    const actualPixels = reportedWidth * reportedHeight
    expect(actualPixels).toBeLessThan(requestedPixels)
  })
})
