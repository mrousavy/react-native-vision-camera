import { SkCanvas, SkImage, SkPaint, SkSurface, Skia } from '@shopify/react-native-skia'
import { Platform } from 'react-native'
import { Frame, FrameInternal } from '../Frame'
import { DependencyList, useMemo } from 'react'
import { ISharedValue, useSharedValue } from 'react-native-worklets-core'
import { Orientation } from '../Orientation'
import { wrapFrameProcessorWithRefCounting } from '../FrameProcessorPlugins'
import { DrawableFrameProcessor } from '../CameraProps'

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
   * A private method to dispose the internally created Textures after rendering has completed.
   * @internal
   */
  dispose(): void
  /**
   * A private lazy property accessed by the native Frame Processor Plugin system
   * to get the actual Frame Host Object.
   * @internal
   */
  readonly __frame: Frame
}

const NEEDS_CPU_COPY = Platform.OS === 'ios'

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

function getPortraitSize(frame: Frame): { width: number; height: number } {
  if (frame.orientation === 'landscape-left' || frame.orientation === 'landscape-right') {
    // it is rotated to some side, so we need to apply rotations first.
    return { width: frame.height, height: frame.height }
  } else {
    // it is already rotated upright.
    return { width: frame.width, height: frame.height }
  }
}

/**
 * Create a new Frame Processor function which you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.
 */
export function createSkiaFrameProcessor(
  frameProcessor: DrawableFrameProcessor['frameProcessor'],
  surfaceHolder: ISharedValue<SkSurface | null>,
  offscreenTextures: ISharedValue<SkImage[]>,
): DrawableFrameProcessor {
  const getSkiaSurface = (frame: Frame): SkSurface => {
    'worklet'
    if (surfaceHolder.value == null) {
      // create a new surface with the size of the Frame
      const size = getPortraitSize(frame)
      surfaceHolder.value = Skia.Surface.MakeOffscreen(size.width, size.height)
      if (surfaceHolder.value == null) {
        // it is still null, something went wrong while creating it
        throw new Error(`Failed to create ${size.width}x${size.height} Skia Surface!`)
      }
    }
    return surfaceHolder.value
  }

  const createDrawableFrameProxy = (frame: Frame, canvas: SkCanvas): DrawableFrame => {
    'worklet'

    // Convert Frame to SkImage/Texture
    const platformBuffer = (frame as FrameInternal).getPlatformBuffer()
    let image = Skia.Image.MakeImageFromPlatformBuffer(platformBuffer.pointer)
    if (NEEDS_CPU_COPY) {
      // on iOS, we need to do a CPU copy of the Texture, as otherwise we sometimes
      // encounter flickering issues.
      // TODO: Fix this on the native side so we can avoid the extra CPU copy!
      const copy = image.makeNonTextureImage()
      image.dispose()
      image = copy
    }

    return new Proxy(frame as DrawableFrame, {
      get: (_, property: keyof DrawableFrame) => {
        'worklet'
        if (property === 'render') {
          return (paint?: SkPaint) => {
            'worklet'
            // rotate canvas to properly account for Frame orientation
            canvas.save()
            const rotation = getRotationDegrees(frame.orientation)
            canvas.rotate(rotation, frame.width / 2, frame.height / 2)
            // render the Camera Frame to the Canvas
            if (paint != null) canvas.drawImage(image, 0, 0, paint)
            else canvas.drawImage(image, 0, 0)

            // restore transforms/rotations again
            canvas.restore()
          }
        } else if (property === '__frame') {
          // a hidden property accessed by the native Frame Processor Plugin system
          // to get the actual Frame Host Object.
          return frame
        } else if (property === 'dispose') {
          return () => {
            'worklet'
            // dispose the Frame and the SkImage/Texture
            image.dispose()
            platformBuffer.delete()
          }
        }

        // @ts-expect-error types are rough for Proxy
        return frame[property] ?? canvas[property]
      },
    })
  }

  return {
    frameProcessor: wrapFrameProcessorWithRefCounting((frame) => {
      'worklet'

      // 1. Set up Skia Surface with size of Frame
      const surface = getSkiaSurface(frame)

      // 2. Create DrawableFrame proxy which internally creates an SkImage/Texture
      const canvas = surface.getCanvas()
      const drawableFrame = createDrawableFrameProxy(frame, canvas)

      // 3. Clear the current Canvas
      const black = Skia.Color('black')
      canvas.clear(black)

      // 4. Run any user drawing operations
      frameProcessor(drawableFrame)

      // 5. Flush draw operations and submit to GPU
      surface.flush()

      // 6. Delete the SkImage/Texture that holds the Frame
      drawableFrame.dispose()

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

export function useSkiaFrameProcessor(
  frameProcessor: DrawableFrameProcessor['frameProcessor'],
  dependencies: DependencyList,
): DrawableFrameProcessor {
  const surface = useSharedValue<SkSurface | null>(null)
  const offscreenTextures = useSharedValue<SkImage[]>([])

  return useMemo(
    () => createSkiaFrameProcessor(frameProcessor, surface, offscreenTextures),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  )
}
