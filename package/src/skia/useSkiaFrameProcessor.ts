import type { Frame, FrameInternal } from '../types/Frame'
import type { DependencyList } from 'react'
import { useEffect, useMemo } from 'react'
import type { DrawableFrameProcessor } from '../types/CameraProps'
import type { ISharedValue, IWorkletNativeApi } from 'react-native-worklets-core'
import type { SkCanvas, SkPaint, SkImage, SkSurface } from '@shopify/react-native-skia'
import { WorkletsProxy } from '../dependencies/WorkletsProxy'
import { SkiaProxy } from '../dependencies/SkiaProxy'
import { withFrameRefCounting } from '../frame-processors/withFrameRefCounting'
import { VisionCameraProxy } from '../frame-processors/VisionCameraProxy'
import type { Orientation } from '../types/Orientation'

/**
 * Represents a Camera Frame that can be directly drawn to using Skia.
 *
 * @see {@linkcode useSkiaFrameProcessor}
 * @see {@linkcode render}
 */
export interface DrawableFrame extends Frame, SkCanvas {
  /**
   * Renders the Camera Frame to the Canvas.
   * @param paint An optional Paint object, for example for applying filters/shaders to the Camera Frame.
   */
  render(paint?: SkPaint): void
  /**
   * A private property that holds the SkImage.
   * @internal
   */
  readonly __skImage: SkImage
  /**
   * A private method to dispose the internally created Texture after rendering has completed.
   * @internal
   */
  dispose(): void
}

type Difference<T, U> = Pick<T, Exclude<keyof T, keyof U>>
type DrawableCanvas = Difference<DrawableFrame, Frame>

type ThreadID = ReturnType<IWorkletNativeApi['getCurrentThreadId']>
type SurfaceCache = Record<
  ThreadID,
  {
    surface: SkSurface
    width: number
    height: number
  }
>

function getRotationDegrees(orientation: Orientation): number {
  'worklet'
  switch (orientation) {
    case 'portrait':
      return 0
    case 'landscape-left':
      return 90
    case 'portrait-upside-down':
      return 180
    case 'landscape-right':
      return 270
    default:
      throw new Error(`Frame has invalid Orientation: ${orientation}!`)
  }
}

interface Size {
  width: number
  height: number
}

function getSurfaceSize(frame: Frame): Size {
  'worklet'
  switch (frame.orientation) {
    case 'portrait':
    case 'portrait-upside-down':
      return { width: frame.width, height: frame.height }
    case 'landscape-left':
    case 'landscape-right':
      return { width: frame.height, height: frame.width }
  }
}

/**
 * Create a new Frame Processor function which you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.
 *
 * @worklet
 * @example
 * ```ts
 * const surfaceHolder = Worklets.createSharedValue<SurfaceCache>({})
 * const offscreenTextures = Worklets.createSharedValue<SkImage[]>([])
 * const frameProcessor = createSkiaFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *
 *   frame.render()
 *   for (const face of faces) {
 *     const rect = Skia.XYWHRect(face.x, face.y, face.width, face.height)
 *     frame.drawRect(rect)
 *   }
 * }, surfaceHolder, offscreenTextures)
 * ```
 */
export function createSkiaFrameProcessor(
  frameProcessor: (frame: DrawableFrame) => void,
  surfaceHolder: ISharedValue<SurfaceCache>,
  offscreenTextures: ISharedValue<SkImage[]>,
): DrawableFrameProcessor {
  const Skia = SkiaProxy.Skia
  const Worklets = WorkletsProxy.Worklets

  const getSkiaSurface = (frame: Frame): SkSurface => {
    'worklet'

    // 1. The Frame Processor runs on an iOS `DispatchQueue`, which might use
    //    multiple C++ Threads between runs (it's still serial though - not concurrent!)
    // 2. react-native-skia uses `thread_local` Skia Contexts (`GrDirectContext`),
    //    which means if a new Thread calls a Skia method, it also uses a new
    //    Skia Context.
    //
    // This will cause issues if we cache the `SkSurface` between renders,
    // as the next render might be on a different C++ Thread.
    // When the next render uses a different C++ Thread, it will also use a
    // different Skia Context (`GrDirectContext`) for creating the SkImage,
    // than the one used for creating the `SkSurface` in the first render.
    // This will cause the render to fail, as an SkImage can only be rendered
    // to an SkSurface if both were created on the same Skia Context.
    // To prevent this, we cache the SkSurface on a per-thread basis,
    // so in my tests the DispatchQueue uses up to 10 different Threads,
    // causing 10 different Surfaces to exist in memory.
    // A true workaround would be to expose Skia Contexts to JS in RN Skia,
    // but for now this is fine.
    const threadId = Worklets.getCurrentThreadId()
    const size = getSurfaceSize(frame)
    if (
      surfaceHolder.value[threadId] == null ||
      surfaceHolder.value[threadId]?.width !== size.width ||
      surfaceHolder.value[threadId]?.height !== size.height
    ) {
      const surface = Skia.Surface.MakeOffscreen(size.width, size.height)
      if (surface == null) {
        // skia surface couldn't be allocated
        throw new Error(`Failed to create ${size.width}x${size.height} Skia Surface!`)
      }
      surfaceHolder.value[threadId]?.surface.dispose()
      surfaceHolder.value[threadId] = { surface: surface, width: size.width, height: size.height }
    }
    const surface = surfaceHolder.value[threadId]?.surface
    if (surface == null) throw new Error(`Couldn't find Surface in Thread-cache! ID: ${threadId}`)
    return surface
  }

  const createDrawableProxy = (frame: Frame, canvas: SkCanvas): DrawableFrame => {
    'worklet'

    // Convert Frame to SkImage/Texture
    const nativeBuffer = (frame as FrameInternal).getNativeBuffer()
    const image = Skia.Image.MakeImageFromNativeBuffer(nativeBuffer.pointer)

    // Creates a `Proxy` that holds the SkCanvas, but also adds additional methods such as render() and dispose().
    const canvasProxy = new Proxy(canvas as DrawableCanvas, {
      get(_, property: keyof DrawableCanvas) {
        switch (property) {
          case '__skImage':
            return image
          case 'render':
            return (paint?: SkPaint) => {
              'worklet'
              // 1. save current matrix
              canvas.save()
              // 2. rotate by sensor orientation degrees
              const rotationDegrees = getRotationDegrees(frame.orientation)
              canvas.rotate(rotationDegrees, frame.width / 2, frame.height / 2)

              // 3. translate the rotated frame so (0, 0) is still in the top left corner
              const scale = frame.height / frame.width
              const diff = Math.abs(frame.width - frame.height)
              canvas.translate(diff * scale, diff * scale)

              // 4. render the Camera Frame to the Canvas as-is, matrix is already rotated
              if (paint != null) canvas.drawImage(image, 0, 0, paint)
              else canvas.drawImage(image, 0, 0)

              // 5. restore transformation matrix again
              canvas.restore()
            }
          case 'dispose':
            return () => {
              'worklet'
              // dispose the Frame and the SkImage/Texture
              image.dispose()
              nativeBuffer.delete()
            }
        }
        return canvas[property]
      },
    })

    return (frame as FrameInternal).withBaseClass(canvasProxy)
  }

  return {
    frameProcessor: withFrameRefCounting((frame) => {
      'worklet'

      // 1. Set up Skia Surface with size of Frame
      const surface = getSkiaSurface(frame)

      // 2. Create DrawableFrame proxy which internally creates an SkImage/Texture
      const canvas = surface.getCanvas()
      const drawableFrame = createDrawableProxy(frame, canvas)

      try {
        // 3. Clear the current Canvas
        const black = Skia.Color('black')
        canvas.clear(black)

        // 4. Run any user drawing operations
        frameProcessor(drawableFrame)

        // 5. Flush draw operations and submit to GPU
        surface.flush()
      } finally {
        // 6. Delete the SkImage/Texture that holds the Frame
        drawableFrame.dispose()
      }

      // 7. Capture rendered results as a Texture/SkImage to later render to screen
      const snapshot = surface.makeImageSnapshot()
      const snapshotCopy = snapshot.makeNonTextureImage()
      snapshot.dispose()
      offscreenTextures.value.push(snapshotCopy)

      // 8. Close old textures that are still in the queue.
      while (offscreenTextures.value.length > 1) {
        // shift() atomically removes the first element, and is therefore thread-safe.
        const texture = offscreenTextures.value.shift()
        if (texture == null) break
        texture.dispose()
      }
    }),
    type: 'drawable-skia',
    offscreenTextures: offscreenTextures,
  }
}

/**
 * Returns a memoized Skia Frame Processor function wich you can pass to the `<Camera>`.
 *
 * The Skia Frame Processor alows you to draw ontop of the Frame, and will manage it's internal offscreen Skia Canvas
 * and onscreen Skia preview view.
 *
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @worklet
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Skia Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useSkiaFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *
 *   frame.render()
 *   for (const face of faces) {
 *     const rect = Skia.XYWHRect(face.x, face.y, face.width, face.height)
 *     frame.drawRect(rect)
 *   }
 * }, [])
 * ```
 */
export function useSkiaFrameProcessor(
  frameProcessor: (frame: DrawableFrame) => void,
  dependencies: DependencyList,
): DrawableFrameProcessor {
  const surface = WorkletsProxy.useSharedValue<SurfaceCache>({})
  const offscreenTextures = WorkletsProxy.useSharedValue<SkImage[]>([])

  useEffect(() => {
    return () => {
      // on unmount, we clean up the resources on the Worklet Context.
      // this causes it to run _after_ the Frame Processor has finished executing,
      // if it is currently executing - so we avoid race conditions here.
      VisionCameraProxy.workletContext?.runAsync(() => {
        'worklet'
        const surfaces = Object.values(surface.value).map((v) => v.surface)
        surface.value = {}
        surfaces.forEach((s) => s.dispose())
        while (offscreenTextures.value.length > 0) {
          const texture = offscreenTextures.value.shift()
          if (texture == null) break
          texture.dispose()
        }
      })
    }
  }, [offscreenTextures, surface])

  return useMemo(
    () => createSkiaFrameProcessor(frameProcessor, surface, offscreenTextures),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  )
}
