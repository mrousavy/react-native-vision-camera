import React, { type Ref, useImperativeHandle, useMemo, useRef } from 'react'
import type { ViewProps } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import type { SharedValue } from 'react-native-reanimated'
import type {
  CameraController,
  FocusOptions,
  MeteringMode,
  Point,
  PreviewView,
  PreviewViewMethods,
  PreviewViewProps,
  TorchMode,
} from '..'
import { useExposureUpdater } from '../hooks/internal/useExposureUpdater'
import { useGestureControllers } from '../hooks/internal/useGestureControllers'
import { useTorchModeUpdater } from '../hooks/internal/useTorchModeUpdater'
import { useZoomUpdater } from '../hooks/internal/useZoomUpdater'
import { type CameraProps, useCamera } from '../hooks/useCamera'
import { usePreviewOutput } from '../hooks/usePreviewOutput'
import { NativePreviewView } from './NativePreviewView'

/**
 * A React-ref to the {@linkcode Camera} view.
 * @example
 * ```tsx
 * function App() {
 *   const camera = useRef<CameraRef>(null)
 *   return <Camera {...props} ref={camera} />
 * }
 * ```
 */
export interface CameraRef
  extends PreviewViewMethods,
    Pick<
      CameraController,
      'resetFocus' | 'startZoomAnimation' | 'cancelZoomAnimation'
    > {
  /**
   * Focuses the Camera pipeline to the specified {@linkcode viewPoint}
   * relative to the Camera view's coordinate system using
   * the specified {@linkcode MeteringMode}s.
   * @param viewPoint The point in the view coordinate system to focus to.
   * @param options Options for the focus operation.
   * @throws If the Camera isn't ready yet.
   * @example
   * ```tsx
   * // Focus center
   * await camera.current.focusTo({ x: width / 2, y: height / 2 })
   * ```
   */
  focusTo(viewPoint: Point, options?: FocusOptions): Promise<void>

  /**
   * Get a ref to the {@linkcode PreviewView},
   * or `undefined` if it has not yet been set.
   * This value is set after the first
   * mount, and usually won't change.
   */
  preview: PreviewView | undefined
  /**
   * Get the current {@linkcode CameraController}.
   * This property will be set after `onStarted`
   * has been called, and may change over time.
   */
  controller: CameraController | undefined
}

/**
 * Props for the {@linkcode Camera} component.
 *
 * Extends {@linkcode CameraProps} (the options for the underlying
 * {@linkcode useCamera} hook) with {@linkcode PreviewView}-specific options
 * and convenience props for gesture handling and animated values.
 */
export interface CameraViewProps
  extends CameraProps,
    Pick<ViewProps, 'style' | 'onLayout' | 'pointerEvents' | 'nativeID'>,
    Pick<PreviewViewProps, 'resizeMode' | 'implementationMode'> {
  // PreviewView props
  /**
   * Called when the {@linkcode Camera}'s Preview
   * received its first Frame.
   */
  onPreviewStarted?: () => void
  /**
   * Called when the {@linkcode Camera}'s Preview
   * stopped streaming Frames.
   */
  onPreviewStopped?: () => void

  // Native gestures
  /**
   * Enables (or disables) the native pinch-to-zoom gesture.
   *
   * @throws If this property is enabled and {@linkcode CameraViewProps.zoom | zoom} is not `undefined`.
   * @default false
   */
  enableNativeZoomGesture?: boolean
  /**
   * Enables (or disables) the native tap-to-focus gesture.
   *
   * @default false
   */
  enableNativeTapToFocusGesture?: boolean

  // Controller props
  /**
   * Sets the {@linkcode CameraController.zoom | zoom} value.
   *
   * You can also manually set zoom via
   * {@linkcode CameraController.setZoom | setZoom(...)}.
   *
   * @note This property can be animated via Reanimated by passing a {@linkcode SharedValue}.
   * @throws If this property is set and {@linkcode enableNativeZoomGesture} is enabled.
   * @default 1
   */
  zoom?: number | SharedValue<number>
  /**
   * Sets the {@linkcode CameraController.exposureBias | exposureBias} value.
   *
   * You can also manually set the exposure bias via
   * {@linkcode CameraController.setExposureBias | setExposureBias(...)}.
   *
   * @note This property can be animated via Reanimated by passing a {@linkcode SharedValue}.
   * @default 0
   */
  exposure?: number | SharedValue<number>
  /**
   * Sets the {@linkcode CameraController.torchMode | torchMode} value.
   * @default 'off'
   */
  torchMode?: TorchMode

  // Ref Wrapper
  /**
   * @see {@linkcode CameraRef}
   */
  ref?: Ref<CameraRef>
}

function getAnimatableNumberInitialValue(
  value: number | SharedValue<number> | undefined,
): number | undefined {
  if (value == null) return undefined
  else if (typeof value === 'number') return value
  else return value.get()
}

function CameraImpl({
  implementationMode,
  resizeMode,
  onPreviewStarted,
  onPreviewStopped,
  outputs = [],
  zoom,
  exposure,
  torchMode,
  enableNativeZoomGesture = false,
  enableNativeTapToFocusGesture = false,
  ref,
  ...props
}: CameraViewProps): React.ReactElement {
  // 1. Create `PreviewOutput` for the Camera
  const previewOutput = usePreviewOutput()

  // 3. Create session/controller and add the preview output
  const controller = useCamera({
    ...props,
    outputs: [previewOutput, ...outputs],
    getInitialExposureBias: () => getAnimatableNumberInitialValue(exposure),
    getInitialZoom: () => getAnimatableNumberInitialValue(zoom),
  })

  // 4. Create `ref` for `PreviewView`
  const previewViewRef = useRef<PreviewView>(null)
  const setHybridRef = useMemo(
    () =>
      callback((r: PreviewView) => {
        previewViewRef.current = r
      }),
    [],
  )

  // 5. Create a ref that exposes some funcs on the Controller and the PreviewView.
  useImperativeHandle(
    ref,
    () => ({
      startZoomAnimation(zoom, rate) {
        if (controller == null) throw new Error(`Camera is not yet ready!`)
        return controller.startZoomAnimation(zoom, rate)
      },
      cancelZoomAnimation() {
        if (controller == null) throw new Error(`Camera is not yet ready!`)
        return controller.cancelZoomAnimation()
      },
      async focusTo(viewPoint, options = {}) {
        if (controller == null) throw new Error(`Camera is not yet ready!`)
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        const meteringPoint = previewViewRef.current.createMeteringPoint(
          viewPoint.x,
          viewPoint.y,
        )
        await controller.focusTo(meteringPoint, options)
      },
      async resetFocus() {
        if (controller == null) throw new Error(`Camera is not yet ready!`)
        await controller.resetFocus()
      },
      createMeteringPoint(x, y, size) {
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        return previewViewRef.current.createMeteringPoint(x, y, size)
      },
      takeSnapshot() {
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        return previewViewRef.current.takeSnapshot()
      },
      convertCameraPointToViewPoint(cameraPoint) {
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        return previewViewRef.current.convertCameraPointToViewPoint(cameraPoint)
      },
      convertViewPointToCameraPoint(viewPoint) {
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        return previewViewRef.current.convertViewPointToCameraPoint(viewPoint)
      },
      convertScannedObjectCoordinatesToViewCoordinates(scannedObject) {
        if (previewViewRef.current == null)
          throw new Error(`Camera Preview is not yet ready!`)
        return previewViewRef.current.convertScannedObjectCoordinatesToViewCoordinates(
          scannedObject,
        )
      },
      get preview(): PreviewView | undefined {
        return previewViewRef.current ?? undefined
      },
      get controller(): CameraController | undefined {
        return controller
      },
    }),
    [controller],
  )

  // 6. Update CameraController props
  useZoomUpdater(controller, zoom)
  useExposureUpdater(controller, exposure)
  useTorchModeUpdater(controller, torchMode)

  // 7. Attach any native gesture controllers
  if (enableNativeZoomGesture && zoom != null) {
    throw new Error(
      `\`zoom\` must not be set if \`enableNativeZoomGesture\` is enabled!`,
    )
  }
  const gestureControllers = useGestureControllers({
    controller: controller,
    enableNativeZoomGesture: enableNativeZoomGesture,
    enableNativeTapToFocusGesture: enableNativeTapToFocusGesture,
  })

  // 8. Render view
  return (
    <NativePreviewView
      {...props}
      implementationMode={implementationMode}
      resizeMode={resizeMode}
      gestureControllers={gestureControllers}
      // TODO: Memoize?
      onPreviewStarted={callback(onPreviewStarted)}
      onPreviewStopped={callback(onPreviewStopped)}
      hybridRef={setHybridRef}
      previewOutput={previewOutput}
    />
  )
}

/**
 * The `<Camera />` component.
 *
 * This is a convenience wrapper around {@linkcode useCamera | useCamera(...)}
 * that adds a {@linkcode PreviewView}, wraps methods in a {@linkcode CameraRef},
 * and supports updating {@linkcode CameraViewProps.zoom | zoom} and
 * {@linkcode CameraViewProps.exposure | exposure} via
 * Reanimated {@linkcode SharedValue}s.
 *
 * @example
 * ```tsx
 * function App() {
 *   const camera = useRef<CameraRef>(null)
 *   const device = useCameraDevice('back')
 *   const photoOutput = usePhotoOutput()
 *
 *   return (
 *     <Camera
 *       style={StyleSheet.absoluteFill}
 *       ref={camera}
 *       device={device}
 *       outputs={[photoOutput]}
 *       isActive={true}
 *     />
 *   )
 * }
 * ```
 */
export const Camera = React.memo(CameraImpl)
