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
import type {
  CameraDevice,
  CameraRef,
  Point,
  PreviewImplementationMode,
  PreviewResizeMode,
} from 'react-native-vision-camera'
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

function pointDistance(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

async function expectPreviewSnapshotDimensionsToMatchLayout(
  camera: CameraRef,
  layout: Layout,
) {
  if (Platform.OS !== 'android') {
    console.log('[SKIP] takeSnapshot dimensions: Android only')
    return
  }

  const snapshot = await camera.takeSnapshot()
  try {
    expect(snapshot.width).toBeGreaterThan(0)
    expect(snapshot.height).toBeGreaterThan(0)

    const expectedWidth = PixelRatio.getPixelSizeForLayoutSize(layout.width)
    const expectedHeight = PixelRatio.getPixelSizeForLayoutSize(layout.height)
    expect(snapshot.width).toBeCloseTo(expectedWidth, 0)
    expect(snapshot.height).toBeCloseTo(expectedHeight, 0)
  } finally {
    snapshot.dispose()
  }
}

describe('VisionCamera - Camera View', () => {
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  afterEach(() => {
    cleanup()
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
    await expectPreviewSnapshotDimensionsToMatchLayout(camera, cameraLayout)

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

  it('runs CameraRef controller methods while preview is ready', async () => {
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
      'ref methods Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'ref methods Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'ref methods Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    const controller = camera.controller
    if (controller == null) throw new Error('no Camera controller')

    expectPreviewGeometry(camera, cameraLayout)
    await withTimeout(
      camera.startZoomAnimation(controller.zoom, 1),
      10_000,
      'CameraRef startZoomAnimation',
    )
    await camera.cancelZoomAnimation()

    if (backDevice.supportsFocusMetering) {
      const center: Point = {
        x: cameraLayout.width / 2,
        y: cameraLayout.height / 2,
      }
      await camera.focusTo(center, {
        modes: ['AF'],
        responsiveness: 'snappy',
      })
      await camera.resetFocus()
    } else {
      console.log(
        '[SKIP] CameraRef focusTo: device does not support focus metering',
      )
    }

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
    await withTimeout(stopped.promise, 10_000, 'ref methods Camera onStopped')
  })

  it('applies controller props through the high-level Camera view', async () => {
    const cameraRef = createRef<CameraRef>()
    const targetZoom = Math.min(
      Math.max(backDevice.minZoom, 1.5),
      backDevice.maxZoom,
    )
    const targetExposure = backDevice.supportsExposureBias
      ? Math.min(
          Math.max(1, backDevice.minExposureBias),
          backDevice.maxExposureBias,
        )
      : undefined
    const torchMode = backDevice.hasTorch ? 'on' : 'off'
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
      'controller props Camera onLayout',
    )
    await withTimeout(
      started.promise,
      15_000,
      'controller props Camera onStarted',
    )
    await withTimeout(
      previewStarted.promise,
      15_000,
      'controller props Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    const controller = camera.controller
    if (controller == null) throw new Error('no Camera controller')
    expectPreviewGeometry(camera, cameraLayout)

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={true}
        style={StyleSheet.absoluteFill}
        zoom={targetZoom}
        exposure={targetExposure}
        torchMode={torchMode}
        onPreviewStarted={previewStarted.resolve}
        onError={onError}
      />,
    )

    await waitUntil(() => Math.abs(controller.zoom - targetZoom) < 0.0001, {
      timeout: 10_000,
    })
    expect(controller.zoom).toBeCloseTo(targetZoom, 4)

    if (targetExposure != null) {
      await waitUntil(
        () => Math.abs(controller.exposureBias - targetExposure) < 0.0001,
        { timeout: 10_000 },
      )
      expect(controller.exposureBias).toBeCloseTo(targetExposure, 4)
    }

    if (backDevice.hasTorch) {
      await waitUntil(() => controller.torchMode === 'on', { timeout: 10_000 })
      expect(controller.torchMode).toBe('on')
    } else {
      expect(controller.torchMode).toBe('off')
    }

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
    await withTimeout(
      stopped.promise,
      10_000,
      'controller props Camera onStopped',
    )
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

  it('keeps a flex preview laid out inside a padded overflow-hidden parent', async () => {
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
      <View style={styles.issuePaddedContainer}>
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={true}
          style={styles.issueFlexCamera}
          onLayout={(event) => {
            layout.resolve(toLayout(event))
          }}
          onStarted={started.resolve}
          onStopped={stopped.resolve}
          onPreviewStarted={previewStarted.resolve}
          onError={onError}
        />
      </View>,
    )

    const cameraLayout = await withTimeout(
      layout.promise,
      10_000,
      'padded Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'padded Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'padded Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)
    expect(cameraLayout.x).toBeCloseTo(0, 0)
    expect(cameraLayout.y).toBeCloseTo(PADDING_TOP, 0)
    expect(cameraLayout.height).toBeGreaterThan(0)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    expectPreviewGeometry(camera, cameraLayout)
    await expectPreviewSnapshotDimensionsToMatchLayout(camera, cameraLayout)

    await rerender(
      <View style={styles.issuePaddedContainer}>
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={false}
          style={styles.issueFlexCamera}
          onStopped={stopped.resolve}
          onPreviewStarted={previewStarted.resolve}
          onError={onError}
        />
      </View>,
    )
    await withTimeout(stopped.promise, 10_000, 'padded Camera onStopped')
  })

  it('survives repeated conditional placeholder-to-preview mounts in a padded parent', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
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
        <View style={styles.issuePaddedContainer}>
          <View style={styles.placeholder} />
        </View>,
      )

      await rerender(
        <View style={styles.issuePaddedContainer}>
          <Camera
            ref={cameraRef}
            device={backDevice}
            isActive={true}
            style={styles.issueFlexCamera}
            onLayout={(event) => {
              layout.resolve(toLayout(event))
            }}
            onStarted={started.resolve}
            onStopped={stopped.resolve}
            onPreviewStarted={previewStarted.resolve}
            onError={onError}
          />
        </View>,
      )

      const cameraLayout = await withTimeout(
        layout.promise,
        10_000,
        `conditional Camera onLayout attempt ${attempt}`,
      )
      await withTimeout(
        started.promise,
        15_000,
        `conditional Camera onStarted attempt ${attempt}`,
      )
      await withTimeout(
        previewStarted.promise,
        15_000,
        `conditional Camera onPreviewStarted attempt ${attempt}`,
      )
      expect(sessionError).toBe(undefined)
      expect(cameraLayout.x).toBeCloseTo(0, 0)
      expect(cameraLayout.y).toBeCloseTo(PADDING_TOP, 0)

      const camera = cameraRef.current
      if (camera == null) throw new Error('no Camera ref')
      expectPreviewGeometry(camera, cameraLayout)
      await expectPreviewSnapshotDimensionsToMatchLayout(camera, cameraLayout)

      await rerender(
        <View style={styles.issuePaddedContainer}>
          <Camera
            ref={cameraRef}
            device={backDevice}
            isActive={false}
            style={styles.issueFlexCamera}
            onStopped={stopped.resolve}
            onPreviewStarted={previewStarted.resolve}
            onError={onError}
          />
        </View>,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `conditional Camera onStopped attempt ${attempt}`,
      )
      cleanup()
    }
  })

  it('keeps a fixed 150x300 preview centered on first mount', async () => {
    const cameraRef = createRef<CameraRef>()
    const rootLayout = deferred<Layout>()
    const wrapperLayout = deferred<Layout>()
    const cameraLayout = deferred<Layout>()
    const started = deferred()
    const stopped = deferred()
    const previewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      rootLayout.reject(error)
      wrapperLayout.reject(error)
      cameraLayout.reject(error)
      started.reject(error)
      stopped.reject(error)
      previewStarted.reject(error)
    }

    const { rerender } = await render(
      <View
        style={styles.centeredRoot}
        onLayout={(event) => {
          rootLayout.resolve(toLayout(event))
        }}
      >
        <View
          style={styles.fixedCameraWrapper}
          onLayout={(event) => {
            wrapperLayout.resolve(toLayout(event))
          }}
        >
          <Camera
            ref={cameraRef}
            device={backDevice}
            isActive={true}
            style={styles.fixedCamera}
            onLayout={(event) => {
              cameraLayout.resolve(toLayout(event))
            }}
            onStarted={started.resolve}
            onStopped={stopped.resolve}
            onPreviewStarted={previewStarted.resolve}
            onError={onError}
          />
        </View>
      </View>,
    )

    const root = await withTimeout(
      rootLayout.promise,
      10_000,
      'centered root onLayout',
    )
    const wrapper = await withTimeout(
      wrapperLayout.promise,
      10_000,
      'centered wrapper onLayout',
    )
    const camera = await withTimeout(
      cameraLayout.promise,
      10_000,
      'fixed Camera onLayout',
    )
    await withTimeout(started.promise, 15_000, 'fixed Camera onStarted')
    await withTimeout(
      previewStarted.promise,
      15_000,
      'fixed Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)

    expect(wrapper.width).toBeCloseTo(FIXED_CAMERA_WIDTH, 0)
    expect(wrapper.height).toBeCloseTo(FIXED_CAMERA_HEIGHT, 0)
    expect(wrapper.x).toBeCloseTo((root.width - FIXED_CAMERA_WIDTH) / 2, 0)
    expect(wrapper.y).toBeCloseTo((root.height - FIXED_CAMERA_HEIGHT) / 2, 0)
    expect(camera.x).toBeCloseTo(0, 0)
    expect(camera.y).toBeCloseTo(0, 0)
    expect(camera.width).toBeCloseTo(FIXED_CAMERA_WIDTH, 0)
    expect(camera.height).toBeCloseTo(FIXED_CAMERA_HEIGHT, 0)

    const cameraRefValue = cameraRef.current
    if (cameraRefValue == null) throw new Error('no Camera ref')
    expectPreviewGeometry(cameraRefValue, camera)
    await expectPreviewSnapshotDimensionsToMatchLayout(cameraRefValue, camera)

    await rerender(
      <View style={styles.centeredRoot}>
        <View style={styles.fixedCameraWrapper}>
          <Camera
            ref={cameraRef}
            device={backDevice}
            isActive={false}
            style={styles.fixedCamera}
            onStopped={stopped.resolve}
            onPreviewStarted={previewStarted.resolve}
            onError={onError}
          />
        </View>
      </View>,
    )
    await withTimeout(stopped.promise, 10_000, 'fixed Camera onStopped')
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

  it('switches active state between two mounted Camera views', async () => {
    const firstRef = createRef<CameraRef>()
    const secondRef = createRef<CameraRef>()
    const firstLayout = deferred<Layout>()
    const secondLayout = deferred<Layout>()
    const firstStarted = deferred()
    const firstStopped = deferred()
    const firstPreviewStarted = deferred()
    const secondStarted = deferred()
    const secondPreviewStarted = deferred()
    let sessionError: Error | undefined
    const onError = (error: Error) => {
      sessionError = error
      firstLayout.reject(error)
      secondLayout.reject(error)
      firstStarted.reject(error)
      firstStopped.reject(error)
      firstPreviewStarted.reject(error)
      secondStarted.reject(error)
      secondPreviewStarted.reject(error)
    }

    const { rerender } = await render(
      <View style={styles.switchRoot}>
        <Camera
          ref={firstRef}
          device={backDevice}
          isActive={true}
          style={styles.switchCamera}
          onLayout={(event) => {
            firstLayout.resolve(toLayout(event))
          }}
          onStarted={firstStarted.resolve}
          onStopped={firstStopped.resolve}
          onPreviewStarted={firstPreviewStarted.resolve}
          onError={onError}
        />
        <Camera
          ref={secondRef}
          device={backDevice}
          isActive={false}
          style={styles.switchCamera}
          onLayout={(event) => {
            secondLayout.resolve(toLayout(event))
          }}
          onStarted={secondStarted.resolve}
          onPreviewStarted={secondPreviewStarted.resolve}
          onError={onError}
        />
      </View>,
    )

    const firstCameraLayout = await withTimeout(
      firstLayout.promise,
      10_000,
      'first Camera onLayout',
    )
    await withTimeout(firstStarted.promise, 15_000, 'first Camera onStarted')
    await withTimeout(
      firstPreviewStarted.promise,
      15_000,
      'first Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)
    const firstCamera = firstRef.current
    if (firstCamera == null) throw new Error('no first Camera ref')
    expectPreviewGeometry(firstCamera, firstCameraLayout)

    await rerender(
      <View style={styles.switchRoot}>
        <Camera
          ref={firstRef}
          device={backDevice}
          isActive={false}
          style={styles.switchCamera}
          onStopped={firstStopped.resolve}
          onPreviewStarted={firstPreviewStarted.resolve}
          onError={onError}
        />
        <Camera
          ref={secondRef}
          device={backDevice}
          isActive={true}
          style={styles.switchCamera}
          onLayout={(event) => {
            secondLayout.resolve(toLayout(event))
          }}
          onStarted={secondStarted.resolve}
          onPreviewStarted={secondPreviewStarted.resolve}
          onError={onError}
        />
      </View>,
    )

    await withTimeout(firstStopped.promise, 10_000, 'first Camera onStopped')
    const secondCameraLayout = await withTimeout(
      secondLayout.promise,
      10_000,
      'second Camera onLayout',
    )
    await withTimeout(secondStarted.promise, 15_000, 'second Camera onStarted')
    await withTimeout(
      secondPreviewStarted.promise,
      15_000,
      'second Camera onPreviewStarted',
    )
    expect(sessionError).toBe(undefined)
    const secondCamera = secondRef.current
    if (secondCamera == null) throw new Error('no second Camera ref')
    expectPreviewGeometry(secondCamera, secondCameraLayout)
  })

  it('supports cover and contain resizeMode previews', async () => {
    const resizeModes: PreviewResizeMode[] = ['cover', 'contain']
    let coverTopLeft: Point | undefined
    let containTopLeft: Point | undefined

    for (const resizeMode of resizeModes) {
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
        <View style={styles.centeredRoot}>
          <View style={styles.fixedCameraWrapper}>
            <Camera
              ref={cameraRef}
              device={backDevice}
              isActive={true}
              style={styles.fixedCamera}
              resizeMode={resizeMode}
              onLayout={(event) => {
                layout.resolve(toLayout(event))
              }}
              onStarted={started.resolve}
              onStopped={stopped.resolve}
              onPreviewStarted={previewStarted.resolve}
              onError={onError}
            />
          </View>
        </View>,
      )

      const cameraLayout = await withTimeout(
        layout.promise,
        10_000,
        `${resizeMode} preview onLayout`,
      )
      await withTimeout(
        started.promise,
        15_000,
        `${resizeMode} preview onStarted`,
      )
      await withTimeout(
        previewStarted.promise,
        15_000,
        `${resizeMode} preview onPreviewStarted`,
      )
      expect(sessionError).toBe(undefined)

      const camera = cameraRef.current
      if (camera == null) throw new Error('no Camera ref')
      expectPreviewGeometry(camera, cameraLayout)
      await expectPreviewSnapshotDimensionsToMatchLayout(camera, cameraLayout)
      const topLeft = camera.convertViewPointToCameraPoint({ x: 0, y: 0 })
      if (resizeMode === 'cover') coverTopLeft = topLeft
      else containTopLeft = topLeft

      await rerender(
        <View style={styles.centeredRoot}>
          <View style={styles.fixedCameraWrapper}>
            <Camera
              ref={cameraRef}
              device={backDevice}
              isActive={false}
              style={styles.fixedCamera}
              resizeMode={resizeMode}
              onStopped={stopped.resolve}
              onPreviewStarted={previewStarted.resolve}
              onError={onError}
            />
          </View>
        </View>,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `${resizeMode} preview onStopped`,
      )
      cleanup()
    }

    if (coverTopLeft == null) throw new Error('missing cover top-left point')
    if (containTopLeft == null)
      throw new Error('missing contain top-left point')
    expect(pointDistance(coverTopLeft, containTopLeft)).toBeGreaterThan(0.001)
  })

  it('supports both Android preview implementation modes', async () => {
    if (Platform.OS !== 'android') {
      console.log('[SKIP] implementationMode: Android only')
      return
    }

    const implementationModes: PreviewImplementationMode[] = [
      'performance',
      'compatible',
    ]

    for (const implementationMode of implementationModes) {
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
          implementationMode={implementationMode}
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
        `${implementationMode} preview onLayout`,
      )
      await withTimeout(
        started.promise,
        15_000,
        `${implementationMode} preview onStarted`,
      )
      await withTimeout(
        previewStarted.promise,
        15_000,
        `${implementationMode} preview onPreviewStarted`,
      )
      expect(sessionError).toBe(undefined)

      const camera = cameraRef.current
      if (camera == null) throw new Error('no Camera ref')
      expectPreviewGeometry(camera, cameraLayout)
      await expectPreviewSnapshotDimensionsToMatchLayout(camera, cameraLayout)

      await rerender(
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={false}
          style={StyleSheet.absoluteFill}
          implementationMode={implementationMode}
          onStopped={stopped.resolve}
          onPreviewStarted={previewStarted.resolve}
          onError={onError}
        />,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `${implementationMode} preview onStopped`,
      )
      cleanup()
    }
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
})

const PADDING_TOP = 82
const FIXED_CAMERA_WIDTH = 150
const FIXED_CAMERA_HEIGHT = 300

const styles = StyleSheet.create({
  centeredRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  fixedCameraWrapper: {
    width: FIXED_CAMERA_WIDTH,
    height: FIXED_CAMERA_HEIGHT,
  },
  fixedCamera: {
    width: FIXED_CAMERA_WIDTH,
    height: FIXED_CAMERA_HEIGHT,
    backgroundColor: 'black',
  },
  issuePaddedContainer: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: PADDING_TOP,
    overflow: 'hidden',
  },
  issueFlexCamera: {
    flex: 1,
    backgroundColor: 'black',
  },
  placeholder: {
    flex: 1,
    backgroundColor: 'black',
  },
  switchRoot: {
    flex: 1,
    backgroundColor: 'black',
  },
  switchCamera: {
    flex: 1,
    backgroundColor: 'black',
  },
})
