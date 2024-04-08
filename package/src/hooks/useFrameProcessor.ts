import { DependencyList, useMemo } from 'react'
import type { Frame, FrameInternal } from '../Frame'
import { FrameProcessor } from '../CameraProps'
import { VisionCameraProxy } from '../FrameProcessorPlugins'
import { Skia, SkImage, SkSurface } from '@shopify/react-native-skia'
import { useSharedValue } from 'react-native-worklets-core'

/**
 * Create a new Frame Processor function which you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.
 */
export function createFrameProcessor(frameProcessor: FrameProcessor['frameProcessor'], type: FrameProcessor['type']): FrameProcessor {
  return {
    frameProcessor: (frame: Frame) => {
      'worklet'
      // Increment ref-count by one
      const internal = frame as FrameInternal
      internal.incrementRefCount()
      try {
        // Call sync frame processor
        frameProcessor(frame)
      } catch (e) {
        // Re-throw error on JS Thread
        VisionCameraProxy.throwJSError(e)
      } finally {
        // Potentially delete Frame if we were the last ref (no runAsync)
        internal.decrementRefCount()
      }
    },
    type: type,
  }
}

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *   console.log(`Faces: ${faces}`)
 * }, [])
 * ```
 */
export function useFrameProcessor(frameProcessor: (frame: Frame) => void, dependencies: DependencyList): FrameProcessor {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createFrameProcessor(frameProcessor, 'frame-processor'), dependencies)
}

interface SkiaContext {
  surface: SkSurface
  frame: SkImage
}

export function useSkiaFrameProcessor(
  frameProcessor: (frame: Frame, context: SkiaContext) => void,
  dependencies: DependencyList,
): FrameProcessor {
  const surface = useSharedValue<SkSurface | null>(null)

  return useMemo(
    () => {
      return createFrameProcessor((frame) => {
        'worklet'

        if (surface.value == null) {
          // create a new surface with the size of the Frame
          surface.value = Skia.Surface.MakeOffscreen(frame.width, frame.height)
          if (surface.value == null) {
            // it is still null, something went wrong while creating it
            throw new Error(`Failed to create ${frame.width}x${frame.height} Skia Surface!`)
          }
        }

        const platformBuffer = (frame as FrameInternal).getPlatformBuffer()
        const image = Skia.Image.MakeImageFromPlatformBuffer(platformBuffer.pointer)
        if (image == null) {
          // something went wrong while converting
          throw new Error('Failed to convert Frame to SkImage!')
        }

        const imageCopy = image.makeNonTextureImage()
        frameProcessor(frame, { surface: surface.value, frame: imageCopy })

        imageCopy.dispose()
        image.dispose()
        platformBuffer.delete()
      }, 'frame-processor')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  )
}
