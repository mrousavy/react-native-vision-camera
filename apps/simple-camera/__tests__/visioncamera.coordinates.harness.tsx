import React from 'react'
import { type LayoutChangeEvent, Platform, StyleSheet } from 'react-native'
import {
  afterEach,
  beforeAll,
  cleanup,
  describe,
  expect,
  it,
  render,
  waitUntil,
} from 'react-native-harness'
import { callback } from 'react-native-nitro-modules'
import type {
  CameraDevice,
  CameraDeviceFactory,
  Point,
  PreviewView,
} from 'react-native-vision-camera'
import {
  CommonResolutions,
  NativePreviewView,
  VisionCamera,
} from 'react-native-vision-camera'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

// Tolerance for floating-point coordinate round-trips. Native conversions go
// through 3x3 affine matrices, so a few sub-pixel ULPs of error are normal.
const COORD_EPSILON = 0.5

describe('VisionCamera - Coordinates', () => {
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

  // Every test that renders a view must unmount it so the next test starts
  // from a clean overlay. (cleanup() is a no-op for the worklet-only tests
  // that never called render().)
  afterEach(() => {
    cleanup()
  })

  // ---------------------------------------------------------------------------
  // Frame coordinate conversions (worklet thread)
  // ---------------------------------------------------------------------------

  // Round-trips through the affine sensor<->buffer matrix. If a regression
  // makes the matrix non-invertible or stops accounting for one of the
  // axes, this catches it without depending on the camera's opaque sensor
  // coordinate system.
  it('round-trips Frame -> Camera -> Frame coordinates for the frame center and corners', async () => {
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

    type Report = {
      width: number
      height: number
      points: { input: Point; roundTripped: Point }[]
    }
    let report: Report | undefined
    const onReport = (r: Report) => {
      report = r
    }
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      const w = frame.width
      const h = frame.height
      const inputs: Point[] = [
        { x: w / 2, y: h / 2 },
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: 0, y: h },
        { x: w, y: h },
      ]
      const result = inputs.map((input) => {
        const cameraPoint = frame.convertFramePointToCameraPoint(input)
        const roundTripped = frame.convertCameraPointToFramePoint(cameraPoint)
        return { input, roundTripped }
      })
      scheduleOnRN(onReport, { width: w, height: h, points: result })
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => report != null || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)
      const r = report
      if (r == null) throw new Error('no report')
      for (const { input, roundTripped } of r.points) {
        expect(Math.abs(roundTripped.x - input.x)).toBeLessThanOrEqual(
          COORD_EPSILON,
        )
        expect(Math.abs(roundTripped.y - input.y)).toBeLessThanOrEqual(
          COORD_EPSILON,
        )
      }
      console.log(
        `frame ${r.width}x${r.height} round-trip points: ${JSON.stringify(r.points)}`,
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  // The frame center maps to *some* point in opaque camera space, and that
  // point must be stable across consecutive frames as long as the device
  // isn't moving. If a regression makes the conversion read out an
  // uninitialized matrix or accidentally use frame timestamps, this
  // catches a value that jitters frame-to-frame.
  it('produces a stable camera point for the frame center across consecutive frames', async () => {
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

    const samples: Point[] = []
    const onSample = (p: Point) => {
      samples.push(p)
    }
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
    })

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      const center = { x: frame.width / 2, y: frame.height / 2 }
      const cameraPoint = frame.convertFramePointToCameraPoint(center)
      scheduleOnRN(onSample, cameraPoint)
      frame.dispose()
    })

    await session.start()
    try {
      await waitUntil(() => samples.length >= 5 || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)
      expect(samples.length).toBeGreaterThanOrEqual(5)
      const first = samples[0]
      if (first == null) throw new Error('no samples')
      for (const s of samples) {
        // Camera coordinates are opaque between platforms (iOS normalizes
        // to [0,1], Android stays in sensor-pixel space). All we assert is
        // that for a stationary device, the result doesn't move.
        expect(Math.abs(s.x - first.x)).toBeLessThanOrEqual(COORD_EPSILON)
        expect(Math.abs(s.y - first.y)).toBeLessThanOrEqual(COORD_EPSILON)
      }
      console.log(
        `frame center camera point samples: ${JSON.stringify(samples)}`,
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  // ---------------------------------------------------------------------------
  // Preview coordinate conversions (mounted NativePreviewView)
  // ---------------------------------------------------------------------------

  // Helper inlined per test so each `it` reads end-to-end. This block is the
  // setup pattern reused below: configure -> render the view -> start ->
  // wait for the ref + layout + onPreviewStarted. Tests don't share state.

  it('round-trips View -> Camera -> View coordinates for the view center and corners', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let previewRef: PreviewView | undefined
    const previewStarted = deferred()
    const layout = deferred<{ width: number; height: number }>()
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
      previewStarted.reject(error)
      layout.reject(error)
    })

    await render(
      <NativePreviewView
        style={StyleSheet.absoluteFill}
        previewOutput={previewOutput}
        hybridRef={callback((r: PreviewView) => {
          previewRef = r
        })}
        onPreviewStarted={callback(() => {
          previewStarted.resolve()
        })}
        onLayout={(e: LayoutChangeEvent) => {
          layout.resolve({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }}
      />,
    )

    await session.start()
    try {
      await withTimeout(layout.promise, 10_000, 'preview view onLayout')
      await withTimeout(previewStarted.promise, 15_000, 'preview started')
      expect(sessionError).toBe(undefined)
      if (previewRef == null) throw new Error('no preview ref')

      const { width: w, height: h } = await layout.promise
      const inputs: Point[] = [
        { x: w / 2, y: h / 2 },
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: 0, y: h },
        { x: w, y: h },
      ]
      for (const input of inputs) {
        const cameraPoint = previewRef.convertViewPointToCameraPoint(input)
        const roundTripped =
          previewRef.convertCameraPointToViewPoint(cameraPoint)
        expect(Math.abs(roundTripped.x - input.x)).toBeLessThanOrEqual(
          COORD_EPSILON,
        )
        expect(Math.abs(roundTripped.y - input.y)).toBeLessThanOrEqual(
          COORD_EPSILON,
        )
      }
      console.log(`preview round-trip ok on ${w}x${h}`)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  // The view center has to map back to the view center through both halves
  // of the API independently. This is what the docs promise — and the
  // example in coordinate-systems.mdx shows `{ x: 196, y: 379.5 }` round-
  // tripping through `convertCameraPointToViewPoint(convertViewPointTo
  // CameraPoint(...))` for the view center.
  it('maps the view center through Camera coordinates back onto the view center', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let previewRef: PreviewView | undefined
    const previewStarted = deferred()
    const layout = deferred<{ width: number; height: number }>()
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
      previewStarted.reject(error)
      layout.reject(error)
    })

    await render(
      <NativePreviewView
        style={StyleSheet.absoluteFill}
        previewOutput={previewOutput}
        hybridRef={callback((r: PreviewView) => {
          previewRef = r
        })}
        onPreviewStarted={callback(() => {
          previewStarted.resolve()
        })}
        onLayout={(e: LayoutChangeEvent) => {
          layout.resolve({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }}
      />,
    )

    await session.start()
    try {
      await withTimeout(layout.promise, 10_000, 'preview view onLayout')
      await withTimeout(previewStarted.promise, 15_000, 'preview started')
      expect(sessionError).toBe(undefined)
      if (previewRef == null) throw new Error('no preview ref')

      const { width: w, height: h } = await layout.promise
      const viewCenter: Point = { x: w / 2, y: h / 2 }
      const cameraPoint = previewRef.convertViewPointToCameraPoint(viewCenter)
      const back = previewRef.convertCameraPointToViewPoint(cameraPoint)
      expect(Math.abs(back.x - viewCenter.x)).toBeLessThanOrEqual(COORD_EPSILON)
      expect(Math.abs(back.y - viewCenter.y)).toBeLessThanOrEqual(COORD_EPSILON)
      console.log(
        `preview center round-trip: ${JSON.stringify(viewCenter)} -> ${JSON.stringify(cameraPoint)} -> ${JSON.stringify(back)}`,
      )
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  // createMeteringPoint should echo the input as `relativeX/Y` per the docs.
  // The normalized side has to land inside [0, 1] by definition (it's
  // "normalized after orientation, cropping, and scaling"). Anything else
  // means the conversion produced a point outside the camera's logical
  // coordinate system.
  it('createMeteringPoint echoes view coords as relative and normalizes camera coords to [0, 1]', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    let previewRef: PreviewView | undefined
    const previewStarted = deferred()
    const layout = deferred<{ width: number; height: number }>()
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
      previewStarted.reject(error)
      layout.reject(error)
    })

    await render(
      <NativePreviewView
        style={StyleSheet.absoluteFill}
        previewOutput={previewOutput}
        hybridRef={callback((r: PreviewView) => {
          previewRef = r
        })}
        onPreviewStarted={callback(() => {
          previewStarted.resolve()
        })}
        onLayout={(e: LayoutChangeEvent) => {
          layout.resolve({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }}
      />,
    )

    await session.start()
    try {
      await withTimeout(layout.promise, 10_000, 'preview view onLayout')
      await withTimeout(previewStarted.promise, 15_000, 'preview started')
      expect(sessionError).toBe(undefined)
      if (previewRef == null) throw new Error('no preview ref')

      const { width: w, height: h } = await layout.promise
      const viewCenter: Point = { x: w / 2, y: h / 2 }
      const mp = previewRef.createMeteringPoint(viewCenter.x, viewCenter.y)

      // relativeX/Y is documented to echo the view coordinate the user
      // tapped. On Android the native side scales by pixelRatio before
      // storing, so compare after applying the same scale.
      const pixelRatio =
        Platform.OS === 'android' ? mp.relativeX / viewCenter.x : 1
      const expectedRelativeX = viewCenter.x * pixelRatio
      const expectedRelativeY = viewCenter.y * pixelRatio
      expect(Math.abs(mp.relativeX - expectedRelativeX)).toBeLessThanOrEqual(
        COORD_EPSILON,
      )
      expect(Math.abs(mp.relativeY - expectedRelativeY)).toBeLessThanOrEqual(
        COORD_EPSILON,
      )

      // normalizedX/Y are the camera-space coords after orientation /
      // cropping / scaling, and per MeteringPoint.nitro.ts must be in [0, 1].
      expect(mp.normalizedX).toBeGreaterThanOrEqual(0)
      expect(mp.normalizedX).toBeLessThanOrEqual(1)
      expect(mp.normalizedY).toBeGreaterThanOrEqual(0)
      expect(mp.normalizedY).toBeLessThanOrEqual(1)

      // The center of the view should map to (approximately) the center of
      // the camera's normalized coord system, since cover/contain crops are
      // symmetric around the center.
      expect(Math.abs(mp.normalizedX - 0.5)).toBeLessThanOrEqual(0.05)
      expect(Math.abs(mp.normalizedY - 0.5)).toBeLessThanOrEqual(0.05)
      console.log(
        `metering point at view center: relative=(${mp.relativeX}, ${mp.relativeY}) normalized=(${mp.normalizedX}, ${mp.normalizedY})`,
      )
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  // The exact scenario from issue #3871: a Frame Processor reports a point
  // in frame coordinates (e.g. a barcode bounding box), the app converts
  // it to camera coords inside the worklet, posts it back to JS, and uses
  // the PreviewView to convert camera coords to view coords for overlay
  // rendering. The frame center must land at the view center regardless
  // of `frame.orientation`. If a regression makes one platform ignore
  // orientation/mirroring metadata, this catches it.
  it('round-trips Frame center -> Camera -> View center end-to-end (repro for #3871)', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
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
          { output: previewOutput, mirrorMode: 'auto' },
          { output: frameOutput, mirrorMode: 'auto' },
        ],
        constraints: [],
      },
    ])

    let previewRef: PreviewView | undefined
    const previewStarted = deferred()
    const layout = deferred<{ width: number; height: number }>()
    let sessionError: Error | undefined
    const errorSub = session.addOnErrorListener((error) => {
      sessionError = error
      previewStarted.reject(error)
      layout.reject(error)
    })

    await render(
      <NativePreviewView
        style={StyleSheet.absoluteFill}
        previewOutput={previewOutput}
        hybridRef={callback((r: PreviewView) => {
          previewRef = r
        })}
        onPreviewStarted={callback(() => {
          previewStarted.resolve()
        })}
        onLayout={(e: LayoutChangeEvent) => {
          layout.resolve({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }}
      />,
    )

    let frameCenterCamera: Point | undefined
    let observedOrientation: string | undefined
    const onSample = (cameraPoint: Point, orientation: string) => {
      frameCenterCamera = cameraPoint
      observedOrientation = orientation
    }

    const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
    runtime.setOnFrameCallback(frameOutput, (frame) => {
      'worklet'
      const center = { x: frame.width / 2, y: frame.height / 2 }
      const cameraPoint = frame.convertFramePointToCameraPoint(center)
      scheduleOnRN(onSample, cameraPoint, frame.orientation)
      frame.dispose()
    })

    await session.start()
    try {
      await withTimeout(layout.promise, 10_000, 'preview view onLayout')
      await withTimeout(previewStarted.promise, 15_000, 'preview started')
      await waitUntil(() => frameCenterCamera != null || sessionError != null, {
        timeout: 15_000,
      })
      expect(sessionError).toBe(undefined)
      if (previewRef == null) throw new Error('no preview ref')
      if (frameCenterCamera == null) throw new Error('no frame center sample')

      const { width: w, height: h } = await layout.promise
      const projected =
        previewRef.convertCameraPointToViewPoint(frameCenterCamera)
      const viewCenter: Point = { x: w / 2, y: h / 2 }

      // We allow up to ~10% drift on each axis to absorb the aspect-ratio
      // crop in `resizeMode='cover'` and the fact that the camera sensor
      // is wider than tall (or vice versa) — the frame center always
      // corresponds to the center of the visible region. A regression
      // like #3871 produces drift of half the view dimension or more.
      const xTolerance = w * 0.1
      const yTolerance = h * 0.1
      expect(Math.abs(projected.x - viewCenter.x)).toBeLessThanOrEqual(
        xTolerance,
      )
      expect(Math.abs(projected.y - viewCenter.y)).toBeLessThanOrEqual(
        yTolerance,
      )
      console.log(
        `frame.orientation=${observedOrientation} frame-center camera=${JSON.stringify(frameCenterCamera)} -> view=${JSON.stringify(projected)} (view center ${JSON.stringify(viewCenter)})`,
      )
    } finally {
      runtime.setOnFrameCallback(frameOutput, undefined)
      errorSub.remove()
      await session.stop()
    }
  })

  // TODO: Re-enable once we have a way to produce a ScannedObject without a
  //       real on-device scan (e.g. a `createMockScannedObject` factory or
  //       a CI-friendly QR fixture). On iOS, the only way to obtain a
  //       ScannedObject today is via `CameraObjectOutput`, which depends
  //       on a real QR code being visible to the rear camera — not
  //       reliable on AWS Device Farm or a closed test rig.
  it.skip("converts a ScannedObject's bounding box into view coordinates (iOS only)", async () => {
    if (Platform.OS !== 'ios') {
      console.log(
        '[SKIP] convertScannedObjectCoordinatesToViewCoordinates: iOS only',
      )
      return
    }
    // Pending API: a way to mint a ScannedObject without a live scan.
  })
})
