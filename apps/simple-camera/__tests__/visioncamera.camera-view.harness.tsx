import { createRef, useCallback, useMemo, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet } from 'react-native'
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
  Constraint,
  Point,
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

  it('reconfigures outputs and immediately restarts from Camera lifecycle callbacks', async () => {
    const maxCycles = 120
    const finished = deferred<number>()
    let sessionError: Error | undefined

    function RestartingCamera() {
      const [isActive, setIsActive] = useState(true)
      const [cycle, setCycle] = useState(0)
      const [variant, setVariant] = useState(0)
      const [enablePhotoHDR, setEnablePhotoHDR] = useState(false)

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution:
              variant % 2 === 0
                ? CommonResolutions.FHD_16_9
                : CommonResolutions.HD_16_9,
            targetBitRate: variant % 2 === 0 ? 20_000_000 : 12_000_000,
            enableAudio: false,
          }),
        [variant],
      )
      const outputs = useMemo(
        () => [photoOutput, videoOutput],
        [photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (backDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (backDevice.supportsVideoStabilizationMode('cinematic-extended')) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        if (enablePhotoHDR && backDevice.supportsPhotoHDR) {
          nextConstraints.unshift({ photoHDR: true })
        }
        return nextConstraints
      }, [enablePhotoHDR])
      const onStarted = useCallback(() => {
        setIsActive(false)
      }, [])
      const onStopped = useCallback(() => {
        const nextCycle = cycle + 1
        if (nextCycle >= maxCycles) {
          console.log(
            `start crash repro harness completed ${nextCycle} cycles on ${backDevice.localizedName}`,
          )
          finished.resolve(nextCycle)
          return
        }

        setCycle(nextCycle)
        setVariant((current) => current + 1)
        setEnablePhotoHDR((current) => !current)
        setIsActive(true)
      }, [cycle])
      const onError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])

      return (
        <Camera
          device={backDevice}
          isActive={isActive}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          onStarted={onStarted}
          onStopped={onStopped}
          onError={onError}
        />
      )
    }

    await render(<RestartingCamera />)
    const cycles = await withTimeout(
      finished.promise,
      120_000,
      'Camera output reconfigure/restart cycles',
    )

    expect(cycles).toBe(maxCycles)
    expect(sessionError).toBe(undefined)
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
