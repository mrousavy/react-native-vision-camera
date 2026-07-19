import { screen } from '@react-native-harness/ui'
import { createRef } from 'react'
import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
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
import type { CameraDevice, CameraRef, Point } from 'react-native-vision-camera'
import {
  Camera,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'
import { deferred, withTimeout } from './test-utils'

interface Layout {
  x: number
  y: number
  width: number
  height: number
}

function toLayout(event: LayoutChangeEvent): Layout {
  const layout = event.nativeEvent.layout
  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  }
}

function expectPreviewGeometry(camera: CameraRef, layout: Layout) {
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.height).toBeGreaterThan(0)
  expect(camera.preview).toBeDefined()
  expect(camera.controller).toBeDefined()

  const viewCenter: Point = { x: layout.width / 2, y: layout.height / 2 }
  const cameraPoint = camera.convertViewPointToCameraPoint(viewCenter)
  const roundTripped = camera.convertCameraPointToViewPoint(cameraPoint)
  expect(roundTripped.x).toBeCloseTo(viewCenter.x, 0)
  expect(roundTripped.y).toBeCloseTo(viewCenter.y, 0)

  const meteringPoint = camera.createMeteringPoint(viewCenter.x, viewCenter.y)
  expect(meteringPoint.relativeX).toBeCloseTo(viewCenter.x, 0)
  expect(meteringPoint.relativeY).toBeCloseTo(viewCenter.y, 0)
  expect(meteringPoint.normalizedX).toBeGreaterThanOrEqual(0)
  expect(meteringPoint.normalizedX).toBeLessThanOrEqual(1)
  expect(meteringPoint.normalizedY).toBeGreaterThanOrEqual(0)
  expect(meteringPoint.normalizedY).toBeLessThanOrEqual(1)
}

const SPACER_HEIGHT = 200

describe('VisionCamera - Camera View', () => {
  let backDevice: CameraDevice
  let frontDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    const front = factory.getDefaultCamera('front')
    expect(back).toBeDefined()
    expect(front).toBeDefined()
    if (back == null) throw new Error('no back camera')
    if (front == null) throw new Error('no front camera')
    backDevice = back
    frontDevice = front
  })

  afterEach(() => {
    cleanup()
  })

  it('preserves preview position when laid out below a sibling spacer (issue #3897)', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip(
        'Preview spacer-positioned layout: Android-only regression',
      )
    }

    const started = deferred()
    const previewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      started.reject(error)
      previewStarted.reject(error)
    }

    await render(
      <View style={styles.spacerRoot}>
        <View style={styles.redSpacer} />
        <Camera
          device={backDevice}
          isActive={true}
          style={styles.spacerCamera}
          onStarted={started.resolve}
          onPreviewStarted={previewStarted.resolve}
          onError={onError}
        />
      </View>,
    )

    await withTimeout(started.promise, 15_000, 'spacer Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'spacer Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    // Yield two frames so the fitter's layout commit reaches the render
    // pipeline before we snapshot. Matches the harness's own
    // waitForNativeViewHierarchy pattern.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )

    const png = await screen.screenshot()
    if (png == null) throw new Error('screen.screenshot returned null')
    // ScreenshotResult.width/height come back as 0, so parse the PNG IHDR
    // (width @ byte 16, height @ byte 20, big-endian).
    const dv = new DataView(
      png.data.buffer,
      png.data.byteOffset,
      png.data.byteLength,
    )
    const fileW = dv.getUint32(16, false)
    const fileH = dv.getUint32(20, false)

    // Compare only the spacer's pixel band; the rest is live camera feed
    // that legitimately varies between runs.
    const spacerPx = SPACER_HEIGHT * PixelRatio.get()
    await expect({
      data: png.data,
      width: fileW,
      height: fileH,
    }).toMatchImageSnapshot({
      name: 'spacer-region-stays-red',
      failureThresholdType: 'percent',
      failureThreshold: 0.02,
      ignoreRegions: [
        { x: 0, y: spacerPx, width: fileW, height: fileH - spacerPx },
      ],
    })
  })

  it('starts the high-level Camera preview and exposes preview/controller ref methods', async () => {
    const cameraRef = createRef<CameraRef>()
    const layout = deferred<Layout>()
    const started = deferred()
    const stopped = deferred()
    const previewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      layout.reject(error)
      started.reject(error)
      stopped.reject(error)
      previewStarted.reject(error)
    }

    const { rerender } = await render(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          layout.resolve(toLayout(event))
        }}
        onStarted={started.resolve}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )

    const cameraLayout = await withTimeout(
      layout.promise,
      10_000,
      'Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'Camera onStarted')
    await withTimeout(previewStarted.promise, 15_000, 'Camera onPreviewStarted')
    expect(sessionError).toBe(undefined)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    expectPreviewGeometry(camera, cameraLayout)

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={false}
        style={StyleSheet.absoluteFill}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )
    await withTimeout(stopped.promise, 10_000, 'Camera onStopped')
  })

  it('runs preview with a photo output attached and captures a JPEG', async () => {
    const cameraRef = createRef<CameraRef>()
    const photoOutput = VisionCamera.createPhotoOutput({
      targetResolution: CommonResolutions.HD_4_3,
      containerFormat: 'jpeg',
      quality: 0.8,
      qualityPrioritization: 'balanced',
    })
    const layout = deferred<Layout>()
    const started = deferred()
    const stopped = deferred()
    const previewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      layout.reject(error)
      started.reject(error)
      stopped.reject(error)
      previewStarted.reject(error)
    }

    const { rerender } = await render(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={true}
        outputs={[photoOutput]}
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          layout.resolve(toLayout(event))
        }}
        onStarted={started.resolve}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )

    const cameraLayout = await withTimeout(
      layout.promise,
      10_000,
      'photo Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'photo Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'photo Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    expectPreviewGeometry(camera, cameraLayout)

    const photo = await photoOutput.capturePhoto(
      { flashMode: 'off', enableShutterSound: false },
      {},
    )
    try {
      expect(photo.width).toBeGreaterThan(0)
      expect(photo.height).toBeGreaterThan(0)
      expect(photo.containerFormat).toBe('jpeg')
      expect(photo.isRawPhoto).toBe(false)
    } finally {
      photo.dispose()
    }

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={false}
        outputs={[photoOutput]}
        style={StyleSheet.absoluteFill}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )
    await withTimeout(stopped.promise, 10_000, 'photo Camera onStopped')
  })

  it('mounts with native tap-to-focus and zoom gestures enabled', async () => {
    const cameraRef = createRef<CameraRef>()
    const layout = deferred<Layout>()
    const started = deferred()
    const stopped = deferred()
    const previewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      layout.reject(error)
      started.reject(error)
      stopped.reject(error)
      previewStarted.reject(error)
    }

    const { rerender } = await render(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        enableNativeTapToFocusGesture={true}
        enableNativeZoomGesture={true}
        onLayout={(event) => {
          layout.resolve(toLayout(event))
        }}
        onStarted={started.resolve}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )

    const cameraLayout = await withTimeout(
      layout.promise,
      10_000,
      'gesture Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'gesture Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'gesture Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    expectPreviewGeometry(camera, cameraLayout)

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={false}
        style={StyleSheet.absoluteFill}
        enableNativeTapToFocusGesture={true}
        enableNativeZoomGesture={true}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )
    await withTimeout(stopped.promise, 10_000, 'gesture Camera onStopped')
  })

  it('starts a new Camera view after the previous one unmounts', async () => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const cameraRef = createRef<CameraRef>()
      const layout = deferred<Layout>()
      const started = deferred()
      const previewStarted = deferred()
      let sessionError: Error | undefined
      const onError = (error: Error) => {
        sessionError = error
        layout.reject(error)
        started.reject(error)
        previewStarted.reject(error)
      }

      await render(
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={true}
          style={StyleSheet.absoluteFill}
          onLayout={(event) => {
            layout.resolve(toLayout(event))
          }}
          onStarted={started.resolve}
          onPreviewStarted={previewStarted.resolve}
          onError={onError}
        />,
      )

      const cameraLayout = await withTimeout(
        layout.promise,
        10_000,
        `remounted Camera onLayout attempt ${attempt}`,
      )
      await withTimeout(
        started.promise,
        15_000,
        `remounted Camera onStarted attempt ${attempt}`,
      )
      await withTimeout(
        previewStarted.promise,
        15_000,
        `remounted Camera onPreviewStarted attempt ${attempt}`,
      )
      expect(sessionError).toBe(undefined)

      const camera = cameraRef.current
      if (camera == null) throw new Error('no Camera ref')
      expectPreviewGeometry(camera, cameraLayout)

      cleanup()
    }
  })

  it('replaces an active Camera view with another active Camera view in one update', async () => {
    const firstRef = createRef<CameraRef>()
    const secondRef = createRef<CameraRef>()
    const firstLayout = deferred<Layout>()
    const secondLayout = deferred<Layout>()
    const firstStarted = deferred()
    const firstPreviewStarted = deferred()
    const secondStarted = deferred()
    const secondPreviewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      firstLayout.reject(error)
      secondLayout.reject(error)
      firstStarted.reject(error)
      firstPreviewStarted.reject(error)
      secondStarted.reject(error)
      secondPreviewStarted.reject(error)
    }

    const { rerender } = await render(
      <Camera
        key="first"
        ref={firstRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          firstLayout.resolve(toLayout(event))
        }}
        onStarted={firstStarted.resolve}
        onPreviewStarted={firstPreviewStarted.resolve}
        onError={onError}
      />,
    )

    const firstCameraLayout = await withTimeout(
      firstLayout.promise,
      10_000,
      'first replaced Camera onLayout',
    )
    await withTimeout(
      firstStarted.promise,
      15_000,
      'first replaced Camera onStarted',
    )
    await withTimeout(
      firstPreviewStarted.promise,
      15_000,
      'first replaced Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const firstCamera = firstRef.current
    if (firstCamera == null) throw new Error('no first Camera ref')
    expectPreviewGeometry(firstCamera, firstCameraLayout)

    await rerender(
      <Camera
        key="second"
        ref={secondRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          secondLayout.resolve(toLayout(event))
        }}
        onStarted={secondStarted.resolve}
        onPreviewStarted={secondPreviewStarted.resolve}
        onError={onError}
      />,
    )

    const secondCameraLayout = await withTimeout(
      secondLayout.promise,
      10_000,
      'second replaced Camera onLayout',
    )
    await withTimeout(
      secondStarted.promise,
      15_000,
      'second replaced Camera onStarted',
    )
    await withTimeout(
      secondPreviewStarted.promise,
      15_000,
      'second replaced Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const secondCamera = secondRef.current
    if (secondCamera == null) throw new Error('no second Camera ref')
    expectPreviewGeometry(secondCamera, secondCameraLayout)
  })

  it('fires stop callbacks when isActive is rerendered from true to false', async () => {
    const cameraRef = createRef<CameraRef>()
    const layout = deferred<Layout>()
    const started = deferred()
    const stopped = deferred()
    const previewStarted = deferred()
    const previewStopped = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      layout.reject(error)
      started.reject(error)
      stopped.reject(error)
      previewStarted.reject(error)
      previewStopped.reject(error)
    }

    const { rerender } = await render(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          layout.resolve(toLayout(event))
        }}
        onStarted={started.resolve}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onPreviewStopped={previewStopped.resolve}
        onError={onError}
      />,
    )

    await withTimeout(layout.promise, 10_000, 'active Camera onLayout')
    await withTimeout(started.promise, 15_000, 'active Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'active Camera onPreviewStarted',
    )

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={false}
        style={StyleSheet.absoluteFill}
        onStopped={stopped.resolve}
        onPreviewStarted={previewStarted.resolve}
        onPreviewStopped={previewStopped.resolve}
        onError={onError}
      />,
    )

    await withTimeout(stopped.promise, 10_000, 'inactive Camera onStopped')
    await withTimeout(
      previewStopped.promise,
      10_000,
      'inactive Camera onPreviewStopped',
    )
    expect(sessionError).toBe(undefined)
  })

  it('reconfigures when the Camera device position prop changes', async () => {
    const cameraRef = createRef<CameraRef>()
    const configuredBack = deferred()
    const configuredFront = deferred()
    const backStarted = deferred()
    const frontStarted = deferred()
    const frontStopped = deferred()
    const backPreviewStarted = deferred()
    let configureCount = 0
    let sessionError: Error | undefined
    const onConfigured = () => {
      configureCount++
      if (configureCount === 1) configuredBack.resolve()
      else if (configureCount === 2) configuredFront.resolve()
    }
    const onError = (error: Error) => {
      sessionError = error
      configuredBack.reject(error)
      configuredFront.reject(error)
      backStarted.reject(error)
      frontStarted.reject(error)
      frontStopped.reject(error)
      backPreviewStarted.reject(error)
    }

    const { rerender } = await render(
      <Camera
        ref={cameraRef}
        device="back"
        isActive={true}
        style={StyleSheet.absoluteFill}
        onConfigured={onConfigured}
        onStarted={backStarted.resolve}
        onPreviewStarted={backPreviewStarted.resolve}
        onError={onError}
      />,
    )

    await withTimeout(configuredBack.promise, 15_000, 'back Camera configured')
    await withTimeout(backStarted.promise, 15_000, 'back Camera onStarted')
    await withTimeout(
      backPreviewStarted.promise,
      15_000,
      'back Camera onPreviewStarted',
    )
    await waitUntil(
      () => cameraRef.current?.controller?.device.id === backDevice.id,
      { timeout: 10_000 },
    )
    expect(cameraRef.current?.controller?.device.position).toBe('back')
    expect(sessionError).toBe(undefined)

    await rerender(
      <Camera
        ref={cameraRef}
        device="front"
        isActive={true}
        style={StyleSheet.absoluteFill}
        onConfigured={onConfigured}
        onStarted={frontStarted.resolve}
        onError={onError}
      />,
    )

    await withTimeout(
      configuredFront.promise,
      15_000,
      'front Camera configured',
    )
    await withTimeout(frontStarted.promise, 15_000, 'front Camera onStarted')
    await waitUntil(
      () => cameraRef.current?.controller?.device.id === frontDevice.id,
      { timeout: 10_000 },
    )
    expect(cameraRef.current?.controller?.device.position).toBe('front')
    expect(sessionError).toBe(undefined)

    await rerender(
      <Camera
        ref={cameraRef}
        device="front"
        isActive={false}
        style={StyleSheet.absoluteFill}
        onStopped={frontStopped.resolve}
        onError={onError}
      />,
    )
    await withTimeout(frontStopped.promise, 10_000, 'front Camera onStopped')
    expect(sessionError).toBe(undefined)
  })
})

const styles = StyleSheet.create({
  spacerRoot: {
    flex: 1,
    backgroundColor: 'black',
  },
  redSpacer: {
    height: SPACER_HEIGHT,
    backgroundColor: 'red',
  },
  spacerCamera: {
    flex: 1,
  },
})
