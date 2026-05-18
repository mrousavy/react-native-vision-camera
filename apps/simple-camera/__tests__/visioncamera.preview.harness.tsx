import {
  createRef,
  type ReactElement,
  type Ref,
  useEffect,
  useState,
} from 'react'
import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import {
  afterEach,
  beforeAll,
  cleanup,
  describe,
  expect,
  it,
  render,
} from 'react-native-harness'
import type {
  CameraDevice,
  CameraRef,
  Point,
  PreviewImplementationMode,
  PreviewResizeMode,
} from 'react-native-vision-camera'
import { Camera, VisionCamera } from 'react-native-vision-camera'
import { deferred, withTimeout } from './test-utils'

type Layout = {
  x: number
  y: number
  width: number
  height: number
}

type CameraHarnessProps = {
  cameraRef: Ref<CameraRef>
  device: CameraDevice
  isActive: boolean
  style: StyleProp<ViewStyle>
  resizeMode?: PreviewResizeMode
  implementationMode?: PreviewImplementationMode
  onLayout?: (event: LayoutChangeEvent) => void
  onStarted?: () => void
  onStopped?: () => void
  onPreviewStarted?: () => void
  onPreviewStopped?: () => void
  onError?: (error: Error) => void
}

function toLayout(event: LayoutChangeEvent): Layout {
  const { x, y, width, height } = event.nativeEvent.layout
  return { x, y, width, height }
}

function expectNear(received: number, expected: number, tolerance = 1) {
  expect(Math.abs(received - expected)).toBeLessThanOrEqual(tolerance)
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

async function expectAndroidSnapshotDimensions(
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
    expectNear(snapshot.width, expectedWidth, 2)
    expectNear(snapshot.height, expectedHeight, 2)
    console.log(
      `preview snapshot ${snapshot.width}x${snapshot.height} for layout ${layout.width}x${layout.height}`,
    )
  } finally {
    snapshot.dispose()
  }
}

function CameraInPaddedContainer({
  cameraRef,
  device,
  isActive,
  style,
  resizeMode,
  implementationMode,
  onLayout,
  onStarted,
  onStopped,
  onPreviewStarted,
  onPreviewStopped,
  onError,
}: CameraHarnessProps): ReactElement {
  return (
    <View style={styles.issuePaddedContainer}>
      <Camera
        ref={cameraRef}
        device={device}
        isActive={isActive}
        style={style}
        resizeMode={resizeMode}
        implementationMode={implementationMode}
        onLayout={onLayout}
        onStarted={onStarted}
        onStopped={onStopped}
        onPreviewStarted={onPreviewStarted}
        onPreviewStopped={onPreviewStopped}
        onError={onError}
      />
    </View>
  )
}

function ConditionalCameraInPaddedContainer({
  cameraRef,
  device,
  isActive,
  style,
  onLayout,
  onStarted,
  onStopped,
  onPreviewStarted,
  onPreviewStopped,
  onError,
}: CameraHarnessProps): ReactElement {
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    setShowCamera(true)
  }, [])

  return (
    <View style={styles.issuePaddedContainer}>
      {showCamera ? (
        <Camera
          ref={cameraRef}
          device={device}
          isActive={isActive}
          style={style}
          onLayout={onLayout}
          onStarted={onStarted}
          onStopped={onStopped}
          onPreviewStarted={onPreviewStarted}
          onPreviewStopped={onPreviewStopped}
          onError={onError}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  )
}

describe('VisionCamera - Preview', () => {
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
    await expectAndroidSnapshotDimensions(camera, cameraLayout)

    await rerender(
      <Camera
        ref={cameraRef}
        device={backDevice}
        isActive={false}
        style={StyleSheet.absoluteFill}
        onStopped={stopped.resolve}
        onError={onError}
      />,
    )
    await withTimeout(stopped.promise, 10_000, 'Camera onStopped')
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
      <CameraInPaddedContainer
        cameraRef={cameraRef}
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
      />,
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
    expectNear(cameraLayout.x, 0)
    expectNear(cameraLayout.y, PADDING_TOP)
    expect(cameraLayout.height).toBeGreaterThan(0)

    const camera = cameraRef.current
    if (camera == null) throw new Error('no Camera ref')
    expectPreviewGeometry(camera, cameraLayout)
    await expectAndroidSnapshotDimensions(camera, cameraLayout)

    await rerender(
      <CameraInPaddedContainer
        cameraRef={cameraRef}
        device={backDevice}
        isActive={false}
        style={styles.issueFlexCamera}
        onStopped={stopped.resolve}
        onError={onError}
      />,
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
        <ConditionalCameraInPaddedContainer
          cameraRef={cameraRef}
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
        />,
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
      expectNear(cameraLayout.x, 0)
      expectNear(cameraLayout.y, PADDING_TOP)

      const camera = cameraRef.current
      if (camera == null) throw new Error('no Camera ref')
      expectPreviewGeometry(camera, cameraLayout)
      await expectAndroidSnapshotDimensions(camera, cameraLayout)

      await rerender(
        <ConditionalCameraInPaddedContainer
          cameraRef={cameraRef}
          device={backDevice}
          isActive={false}
          style={styles.issueFlexCamera}
          onStopped={stopped.resolve}
          onError={onError}
        />,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `conditional Camera onStopped attempt ${attempt}`,
      )
      cleanup()
      console.log(`conditional preview layout attempt ${attempt} passed`)
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

    expectNear(wrapper.width, FIXED_CAMERA_WIDTH)
    expectNear(wrapper.height, FIXED_CAMERA_HEIGHT)
    expectNear(wrapper.x, (root.width - FIXED_CAMERA_WIDTH) / 2)
    expectNear(wrapper.y, (root.height - FIXED_CAMERA_HEIGHT) / 2)
    expectNear(camera.x, 0)
    expectNear(camera.y, 0)
    expectNear(camera.width, FIXED_CAMERA_WIDTH)
    expectNear(camera.height, FIXED_CAMERA_HEIGHT)

    const cameraRefValue = cameraRef.current
    if (cameraRefValue == null) throw new Error('no Camera ref')
    expectPreviewGeometry(cameraRefValue, camera)
    await expectAndroidSnapshotDimensions(cameraRefValue, camera)

    await rerender(
      <View style={styles.centeredRoot}>
        <View style={styles.fixedCameraWrapper}>
          <Camera
            ref={cameraRef}
            device={backDevice}
            isActive={false}
            style={styles.fixedCamera}
            onStopped={stopped.resolve}
            onError={onError}
          />
        </View>
      </View>,
    )
    await withTimeout(stopped.promise, 10_000, 'fixed Camera onStopped')
  })

  it('supports cover and contain resizeMode previews', async () => {
    const resizeModes: PreviewResizeMode[] = ['cover', 'contain']

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
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={true}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
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
      await expectAndroidSnapshotDimensions(camera, cameraLayout)

      await rerender(
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={false}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onStopped={stopped.resolve}
          onError={onError}
        />,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `${resizeMode} preview onStopped`,
      )
      cleanup()
      console.log(`${resizeMode} preview layout passed`)
    }
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
      await expectAndroidSnapshotDimensions(camera, cameraLayout)

      await rerender(
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={false}
          style={StyleSheet.absoluteFill}
          implementationMode={implementationMode}
          onStopped={stopped.resolve}
          onError={onError}
        />,
      )
      await withTimeout(
        stopped.promise,
        10_000,
        `${implementationMode} preview onStopped`,
      )
      cleanup()
      console.log(`${implementationMode} preview layout passed`)
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
})
