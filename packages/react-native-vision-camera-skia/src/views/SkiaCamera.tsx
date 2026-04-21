import {
  Canvas,
  type CanvasProps,
  Image,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react'
import { Platform } from 'react-native'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'
import {
  type CameraController,
  type CameraFrameOutput,
  type CameraProps,
  type CameraSession,
  type CameraSessionConfig,
  type CameraVideoOutput,
  type FocusOptions,
  type Frame,
  type MeteringMode,
  type MirrorMode,
  type CameraOrientation,
  type PixelFormat,
  type Point,
  type ResolutionBiasConstraint,
  type TargetVideoPixelFormat,
  useCamera,
  useFrameOutput,
  useOrientation,
  type VideoPixelFormat,
  VisionCamera,
} from 'react-native-vision-camera'
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets'
import { renderToTexture, type SkiaOnFrameState } from '../render'
import { clearSurfacesCache } from '../SurfacesCache'
import { transformPoint } from '../transformPoint'

/**
 * A reference to a {@linkcode SkiaCamera}.
 *
 * You can obtain a `SkiaCameraRef` via `useRef(...)`:
 * @example
 * ```tsx
 * function App() {
 *   const camera = useRef<SkiaCameraRef>(null)
 *
 *   const onPress = async () => {
 *     const snapshot = await camera.current.takeSnapshot()
 *     console.log('Captured Skia snapshot!', snapshot.getImageInfo())
 *   }
 *
 *   return (
 *     <SkiaCamera
 *       ref={camera}
 *       device="back"
 *       isActive={true}
 *       onFrame={(frame, render) => {
 *         'worklet'
 *         render(({ canvas, frameTexture }) => {
 *           canvas.drawImage(frameTexture, 0, 0)
 *         })
 *         frame.dispose()
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export interface SkiaCameraRef extends Pick<CameraController, 'resetFocus'> {
  /**
   * Focuses the Camera pipeline to the specified {@linkcode viewPoint}
   * relative to the Camera Skia view's coordiante system,
   * using the specified {@linkcode MeteringMode}s.
   * @param viewPoint The point in the view coordinate system to focus to.
   * @param options Options for the focus operation.
   * @example
   * ```tsx
   * // Focus center
   * await camera.current.focusTo({ x: width / 2, y: height / 2 })
   * ```
   */
  focusTo(viewPoint: Point, options?: FocusOptions): Promise<void>
  /**
   * Takes a snapshot of the currently rendered
   * content, or `undefined` if none are available.
   * @example
   * ```ts
   * const snapshot = await camera.current.takeSnapshot()
   * console.log('Captured Skia snapshot!', snapshot.getImageInfo())
   * ```
   */
  takeSnapshot(): SkImage | undefined

  /**
   * Converts the given {@linkcode viewPoint} to
   * a normalized {@linkcode Point} with values ranging from `0...1`.
   */
  convertViewPointToNormalizedPoint(viewPoint: Point): Point
}

/**
 * Represents props for a {@linkcode SkiaCamera}.
 */
export interface SkiaCameraProps
  extends CameraProps,
    Pick<CanvasProps, 'style'> {
  /**
   * A reference to a {@linkcode SkiaCamera}.
   * @see {@linkcode SkiaCameraRef}
   */
  ref?: React.Ref<SkiaCameraRef>
  /**
   * Called on every Frame with the current state.
   *
   * @note You must render the Frame to the Canvas yourself
   * via {@linkcode render}, otherwise it'll just be a black screen.
   * @worklet
   * @example
   * ```ts
   * onFrame(frame, render) {
   *   'worklet'
   *   render(({ frameTexture, canvas }) => {
   *     canvas.drawImage(frameTexture, 0, 0)
   *   })
   *   frame.dispose()
   * }
   * ```
   */
  onFrame: (
    frame: Frame,
    render: (onDraw: (state: SkiaOnFrameState) => void) => void,
  ) => void
  /**
   * Warns the developer if the {@linkcode onFrame | onFrame(...)}
   * callback did not call `render(...)`.
   *
   * Disable this if you intentionally want to skip a render.
   * @default true
   */
  warnIfRenderSkipped?: boolean
  /**
   * Selects the {@linkcode TargetVideoPixelFormat} for the
   * Frame Output using the Skia rendering pipeline.
   *
   * It is recommended to use {@linkcode TargetVideoPixelFormat | 'native'}
   * if the negotiated {@linkcode CameraSessionConfig}'s
   * {@linkcode CameraSessionConfig.nativePixelFormat | nativePixelFormat}
   * is supported by Skia as this is a zero-copy GPU-only path.
   *
   * Only resort back to {@linkcode TargetVideoPixelFormat | 'yuv'}
   * (or possibly even {@linkcode TargetVideoPixelFormat | 'rgb'}) if
   * CPU-based Frame access is required.
   *
   * @note
   * Use {@linkcode TargetVideoPixelFormat | 'native'} with caution,
   * as the device's native format could be a format that is not
   * supported by Skia - for example
   * {@linkcode VideoPixelFormat | 'raw-bayer-packed96-12-bit'}.
   * The {@linkcode PixelFormat | 'private'} pixel format is the
   * most efficient GPU-only pixel format supported by Skia.
   *
   * @default
   * 'native' or 'yuv'
   */
  pixelFormat?: TargetVideoPixelFormat
  /**
   * Physically rotates buffers to the desired target {@linkcode CameraOrientation}
   * and {@linkcode MirrorMode}.
   *
   * By default, it is disabled as Skia rotates and mirrors the
   * Frame via efficient GPU-based transforms.
   * Enabling this results in the {@linkcode Frame} always being
   * upright and never mirrored.
   *
   * @default false
   */
  enablePhysicalBufferRotation?: boolean
  /**
   * Configures the underlying {@linkcode CameraVideoOutput}
   * to downscale {@linkcode Frame}s to a size suitable for
   * preview, such as the screen size.
   *
   * This may be more efficient if the {@linkcode CameraSession}
   * negotiated a high-resolution output, as Skia doesn't
   * have to operate on high-resolution {@linkcode Frame}s.
   * Ideally, configure a matching {@linkcode ResolutionBiasConstraint}
   * upfront so no scaling would be necessary at any point
   * in the pipeline.
   *
   * @default false
   */
  enablePreviewSizedOutputBuffers?: boolean
}

const DEFAULT_PIXEL_FORMAT = Platform.select<TargetVideoPixelFormat>({
  ios: 'yuv',
  android: 'native',
})

function SkiaCameraImpl({
  ref,
  style,
  outputs = [],
  onFrame,
  pixelFormat = DEFAULT_PIXEL_FORMAT,
  enablePhysicalBufferRotation,
  enablePreviewSizedOutputBuffers,
  device,
  orientationSource,
  warnIfRenderSkipped = true,
  ...props
}: SkiaCameraProps): React.ReactElement {
  const texture = useSharedValue<SkImage | null>(null)

  const lastFrameOrientation = useMemo(
    () => createSynchronizable<CameraOrientation | undefined>(undefined),
    [],
  )
  const lastFrameIsMirrored = useMemo(
    () => createSynchronizable<boolean | undefined>(undefined),
    [],
  )

  const canvasSize = useSharedValue({ width: 0, height: 0 })
  const canvasRect = useDerivedValue(() => {
    return {
      x: 0,
      y: 0,
      width: canvasSize.value.width,
      height: canvasSize.value.height,
    }
  })

  const updatePreviewTexture = useCallback(
    (newTexture: SkImage) => {
      const oldTexture = texture.get()
      texture.set(newTexture)
      if (oldTexture != null) {
        oldTexture.dispose()
      }
    },
    [texture],
  )

  const frameOutput = useFrameOutput({
    pixelFormat: pixelFormat,
    dropFramesWhileBusy: true,
    allowDeferredStart: false,
    enablePhysicalBufferRotation: enablePhysicalBufferRotation,
    enablePreviewSizedOutputBuffers: enablePreviewSizedOutputBuffers,
    onFrame: (frame) => {
      'worklet'
      let renderCount = 0
      const render = (onDraw: (state: SkiaOnFrameState) => void) => {
        if (renderCount >= 1) {
          throw new Error(
            `Tried to render Frame twice! Did you call render(...) twice in your <SkiaCamera />?`,
          )
        }
        renderCount++
        let snapshot: SkImage | undefined
        try {
          // 1. Render Frame to a Texture (SkImage) and pass custom onDraw func
          snapshot = renderToTexture(frame, onDraw)
          // 2. Copy to CPU surface as we are crossing Threads
          const snapshotCpuCopy = snapshot.makeNonTextureImage()
          if (snapshotCpuCopy == null) {
            throw new Error(
              `Failed to copy rendered GPU contents to CPU Image!`,
            )
          }
          // 3. Update our Preview with the currently rendered result (and info)
          scheduleOnRN(updatePreviewTexture, snapshotCpuCopy)
          lastFrameOrientation.setBlocking(frame.orientation)
          lastFrameIsMirrored.setBlocking(frame.isMirrored)
        } catch (e) {
          console.error(`Failed to render! ${e}`)
        } finally {
          snapshot?.dispose()
        }
      }

      onFrame(frame, render)

      if (renderCount === 0 && warnIfRenderSkipped) {
        // Not rendering a Frame is fine for certain use-cases, e.g. custom
        // FPS throttling, or intentionally dropping mid-camera-flip Frames.
        // But it can also be accidental, so we warn the user here if that happens.
        console.warn(
          `render(...) was not called - the Frame is effectively dropped from the Skia Preview! ` +
            `Set warnIfRenderSkipped={false} if this is intentional.`,
        )
      }
    },
  })

  const isFront =
    typeof device === 'string'
      ? device === 'front'
      : device.position === 'front'
  const camera = useCamera({
    ...props,
    orientationSource: 'custom',
    outputs: [...outputs, frameOutput],
    device: device,
    mirrorMode: isFront ? 'on' : 'auto',
  })

  // Update output orientations (skia frame output is treated differently)
  const orientationSourceOrUndefined =
    orientationSource === 'custom' ? undefined : orientationSource
  const otherOutputsOrientation =
    useOrientation(orientationSourceOrUndefined) ?? 'up'
  const skiaFrameOutputOrientation = useOrientation('interface') ?? 'up'
  useEffect(() => {
    for (const output of outputs) {
      output.outputOrientation = otherOutputsOrientation
    }
    frameOutput.outputOrientation = skiaFrameOutputOrientation
  }, [
    frameOutput,
    skiaFrameOutputOrientation,
    otherOutputsOrientation,
    outputs,
  ])

  useImperativeHandle(ref, () => ({
    convertViewPointToNormalizedPoint(viewPoint) {
      const { width, height } = canvasSize.get()
      if (width <= 0 || height <= 0) {
        throw new Error(`Cannot focus - Skia Canvas has not been laid out yet!`)
      }
      const isMirrored = lastFrameIsMirrored.getBlocking()
      const orientation = lastFrameOrientation.getBlocking()
      if (isMirrored == null || orientation == null) {
        throw new Error(`Cannot focus - no Frame has been rendered yet!`)
      }
      const normalizedPoint = {
        x: viewPoint.x / width,
        y: viewPoint.y / height,
      }
      const transformedPoint = transformPoint(normalizedPoint, {
        isMirrored,
        orientation,
      })
      return transformedPoint
    },
    async focusTo(viewPoint, options = {}) {
      if (camera == null) {
        throw new Error(`Cannot focus - Camera is null!`)
      }
      const transformedPoint = this.convertViewPointToNormalizedPoint(viewPoint)
      const meteringPoint = VisionCamera.createNormalizedMeteringPoint(
        transformedPoint.x,
        transformedPoint.y,
      )
      return await camera.focusTo(meteringPoint, options)
    },
    async resetFocus() {
      if (camera == null) {
        throw new Error(`Cannot reset focus - Camera is null!`)
      }
      return await camera.resetFocus()
    },
    takeSnapshot() {
      const snapshot = texture.get()
      const cpuImage = snapshot?.makeNonTextureImage()
      if (cpuImage == null) return undefined
      return cpuImage
    },
  }))

  useEffect(() => {
    return () => {
      // On unmount, clear the Surfaces cache to free up memory.
      clearSurfacesCache()
    }
  }, [])

  return (
    <Canvas style={style} onSize={canvasSize}>
      <Image image={texture} rect={canvasRect} fit="cover" />
    </Canvas>
  )
}

/**
 * Represents a Camera view component that uses
 * [Skia](https://github.com/Shopify/react-native-skia)
 * for rendering.
 *
 * Instead of a native Preview View, the {@linkcode SkiaCamera}
 * uses a {@linkcode CameraFrameOutput} to stream
 * {@linkcode Frame | Frames}, which will be converted to
 * Skia Textures (see {@linkcode SkImage}) to be renderable.
 *
 * You must ensure that the {@linkcode Frame}
 * is actually rendered to the {@linkcode SkCanvas}
 * inside your {@linkcode SkiaCameraProps.onFrame | onFrame(...)}
 * callback.
 *
 * @note Your {@linkcode SkiaCameraProps.onFrame | onFrame(...)}
 * callback must be a `'worklet'`.
 * @note It is recommended to manually set a
 * {@linkcode SkiaCameraProps.pixelFormat | pixelFormat},
 * for example {@linkcode TargetVideoPixelFormat | 'yuv'} for
 * efficiency, or {@linkcode TargetVideoPixelFormat | 'rgb'}
 * for compatibility with ML detection libraries.
 * @example
 * Simple rendering _as-is_:
 * ```tsx
 * function App() {
 *   return (
 *     <SkiaCamera
 *       device="back"
 *       isActive={true}
 *       onFrame={(frame, render) => {
 *         'worklet'
 *         render(({ canvas, frameTexture }) => {
 *           canvas.drawImage(frameTexture, 0, 0)
 *         })
 *         frame.dispose()
 *       }}
 *     />
 *   )
 * }
 * ```
 * @example
 * Drawing Frames with a custom pass-through shader:
 * ```tsx
 * // Simple pass-through Shader (just renders pixels as-is)
 * const effect = Skia.RuntimeEffect.Make(`
 * uniform shader src;
 * half4 main(float2 xy) {
 *   return src.eval(xy);
 * }
 * `)!
 * const paint = Skia.Paint()
 *
 * function App() {
 *   return (
 *     <SkiaCamera
 *       device="back"
 *       isActive={true}
 *       onFrame={(frame, render) => {
 *         'worklet'
 *         render(({ canvas, frameTexture }) => {
 *           // Prepare the shader with the `frameTexture` as an input
 *           const imageShader = frameTexture.makeShaderOptions(
 *             TileMode.Clamp,
 *             TileMode.Clamp,
 *             FilterMode.Linear,
 *             MipmapMode.None,
 *           )
 *           const shader = effect.makeShaderWithChildren([], [imageShader])
 *           paint.setShader(shader)
 *
 *           // Draw the Frame with the shader/paint
 *           canvas.drawImage(frameTexture, 0, 0, paint)
 *         })
 *         frame.dispose()
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export const SkiaCamera = React.memo(SkiaCameraImpl)
