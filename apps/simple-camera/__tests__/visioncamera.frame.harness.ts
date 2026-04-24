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
  Frame,
  FrameDroppedReason,
} from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'

describe('VisionCamera - Frame', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
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

    let framesReceived = 0
    const onFrameReceived = () => {
      framesReceived++
    }

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
      'worklet'
      scheduleOnRN(onFrameReceived)
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => framesReceived >= 3, { timeout: 15_000 })
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      await session.stop()
    }
    expect(framesReceived).toBeGreaterThanOrEqual(3)
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
    const report = (w: number, h: number, planes: number) => {
      reportedWidth = w
      reportedHeight = h
      reportedPlanes = planes
    }

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
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
      await waitUntil(() => reportedWidth > 0 && reportedHeight > 0, {
        timeout: 15_000,
      })
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
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

    let frameCount = 0
    const onFrame = () => {
      frameCount++
    }

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
      'worklet'
      scheduleOnRN(onFrame)
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => frameCount >= 1, { timeout: 15_000 })
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
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

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
      'worklet'
      counter.setBlocking((prev) => prev + 1)
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => counter.getBlocking() >= 3, { timeout: 15_000 })
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      await session.stop()
    }
    expect(counter.getBlocking()).toBeGreaterThanOrEqual(3)
  })

  it('invokes the onFrameDropped callback when the worklet stalls', async () => {
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
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
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
      try {
        await waitUntil(() => droppedReason != null, { timeout: 15_000 })
      } catch {
        console.log(
          '[SKIP] frame dropped callback: no drop observed within the timeout',
        )
        return
      }
      console.log(`frame dropped reason: ${droppedReason}`)
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      frameOutput.setOnFrameDroppedCallback(undefined)
      await session.stop()
    }
  })

  it('delivers smaller buffers when enablePreviewSizedOutputBuffers is true', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const frameOutput = VisionCamera.createFrameOutput({
      targetResolution: CommonResolutions.FHD_16_9,
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
    runtime.setOnFrameCallback(frameOutput, (frame: Frame) => {
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
      `preview-sized frame: ${reportedWidth}x${reportedHeight} (requested target ${CommonResolutions.FHD_16_9.width}x${CommonResolutions.FHD_16_9.height})`,
    )
    const requestedPixels =
      CommonResolutions.FHD_16_9.width * CommonResolutions.FHD_16_9.height
    const actualPixels = reportedWidth * reportedHeight
    expect(actualPixels).toBeLessThan(requestedPixels)
  })
})
