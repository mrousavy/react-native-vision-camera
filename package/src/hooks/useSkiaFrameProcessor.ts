import { SkCanvas, SkPaint, SkSurface, Skia } from '@shopify/react-native-skia'
import { Platform } from 'react-native'
import { Frame, FrameInternal } from '../Frame'
import { DependencyList, useMemo } from 'react'
import { FrameProcessor } from '../CameraProps'
import { useSharedValue } from 'react-native-worklets-core'
import { createFrameProcessor } from './useFrameProcessor'
import { Orientation } from '../Orientation'

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

export function useSkiaFrameProcessor(frameProcessor: (frame: DrawableFrame) => void, dependencies: DependencyList): FrameProcessor {
  const surface = useSharedValue<SkSurface | null>(null)

  return useMemo(
    () => {
      return createFrameProcessor((frame) => {
        'worklet'

        const start1 = performance.now()

        // 1. Set up Skia Surface with size of Frame
        if (surface.value == null) {
          // create a new surface with the size of the Frame
          surface.value = Skia.Surface.MakeOffscreen(frame.width, frame.height)
          if (surface.value == null) {
            // it is still null, something went wrong while creating it
            throw new Error(`Failed to create ${frame.width}x${frame.height} Skia Surface!`)
          }
        }

        // 2. Convert Frame (Platform Buffer) to SkImage so we can render it
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

        const end1 = performance.now()

        console.log(`Prepare took ${(end1 - start1).toFixed(2)}ms.`)
        const start2 = performance.now()

        // 3. Prepare DrawableFrame proxy
        const canvas = surface.value.getCanvas()
        const drawableFrame = new Proxy(frame as DrawableFrame, {
          get: (_, property) => {
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
            } else if (property === 'snapshot') {
              const snapshot = surface.value!.makeImageSnapshot()
              const copy = snapshot.makeNonTextureImage()
              snapshot.dispose()
              return copy
            }

            // @ts-expect-error types are rough for Proxy
            return frame[property] ?? canvas[property]
          },
        })

        // 4. Run any user drawing operations
        frameProcessor(drawableFrame)

        // 5. Flush draw operations and submit to GPU
        surface.value.flush()

        // 6. Clean up any resources
        image.dispose()
        platformBuffer.delete()
        const end2 = performance.now()

        console.log(`Render took ${(end2 - start2).toFixed(2)}ms.`)
      }, 'drawable-skia')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  )
}
