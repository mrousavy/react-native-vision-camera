import { useEffect, useState } from 'react'
import type { Frame } from 'react-native-vision-camera'
import { createResizer } from './createResizer'
import type { Resizer } from './specs/Resizer.nitro'
import type { ResizerOptions } from './specs/ResizerFactory.nitro'

/**
 * The current state of the {@linkcode useResizer} hook.
 * - `'loading'`: The {@linkcode Resizer} is still being created.
 * - `'ready'`: The {@linkcode Resizer} has been created successfully and is ready to use.
 * - `'error'`: Creating the {@linkcode Resizer} failed. Inspect `error` for details.
 */
export type ResizerState =
  | { state: 'loading'; resizer: undefined; error: undefined }
  | { state: 'ready'; resizer: Resizer; error: undefined }
  | { state: 'error'; resizer: undefined; error: Error }

/**
 * Releases a {@linkcode Resizer} now instead of leaving it to the garbage collector.
 *
 * This runs from an effect cleanup (including unmount), where a throw would surface as an unhandled
 * error - and a `dispose()` failure is not recoverable from JS anyway. Reaching the catch just means
 * the instance is left to the GC, which is the previous behaviour; warn so that stays visible.
 */
function disposeNow(resizer: Resizer): void {
  try {
    resizer.dispose()
  } catch (error) {
    console.warn(
      `[Resizer] dispose() failed, leaving the instance to the GC: ${String((error as Error)?.message ?? error)}`,
    )
  }
}

/**
 * Use a {@linkcode Resizer} with the given options.
 *
 * The {@linkcode Resizer} can be used to resize and convert
 * {@linkcode Frame}s for ML processing.
 *
 * @discussion
 * Inspect the returned `error` if the {@linkcode Resizer}
 * couldn't be created successfully.
 *
 * @example
 * ```ts
 * function App() {
 *   const { resizer } = useResizer({
 *     width: 192,
 *     height: 192,
 *     channelOrder: 'rgb',
 *     dataType: 'float32',
 *     scaleMode: 'cover',
 *     pixelLayout: 'planar',
 *   })
 *
 *   const frameOutput = useFrameOutput({
 *     pixelFormat: 'yuv',
 *     onFrame(frame) {
 *       'worklet'
 *       if (resizer != null) {
 *         const resized = resizer.resize(frame)
 *         const buffer = resized.getPixelBuffer()
 *         resized.dispose()
 *       }
 *       frame.dispose()
 *     }
 *   })
 * }
 * ```
 */
export function useResizer({
  height,
  width,
  channelOrder,
  dataType,
  scaleMode,
  pixelLayout,
  enabled = true,
}: ResizerOptions & {
  /**
   * Whether a {@linkcode Resizer} should exist right now. Defaults to `true`.
   *
   * Pass `false` to release the underlying GPU resources (the device, its pipeline/shader caches,
   * and on Android the imported camera buffers it holds references on) while nothing is being
   * resized - e.g. while the Camera is paused or the screen is not visible. The hook returns
   * `state: 'loading'` while disabled and creates a fresh {@linkcode Resizer} when re-enabled, so
   * callers must already tolerate a momentarily absent `resizer` (as they do on first mount).
   */
  enabled?: boolean
}): ResizerState {
  const [state, setState] = useState<ResizerState>({
    state: 'loading',
    resizer: undefined,
    error: undefined,
  })

  useEffect(() => {
    if (!enabled) return
    let isCanceled = false
    // The Resizer created by this effect run, so cleanup can dispose it. A Resizer owns a whole GPU
    // device (a VkDevice + shader/pipeline caches on Android, a MTLDevice + CVMetalTextureCache on
    // iOS) and, on Android, an import cache that holds a reference on every camera AHardwareBuffer
    // it has sampled. Leaving that to the GC means those resources outlive the component by an
    // unbounded amount, and every options change orphans another whole device.
    let created: Resizer | undefined
    const load = async () => {
      try {
        const resizer = await createResizer({
          width: width,
          height: height,
          channelOrder: channelOrder,
          dataType: dataType,
          scaleMode: scaleMode,
          pixelLayout: pixelLayout,
        })
        created = resizer
        if (isCanceled) {
          // Deps changed (or we unmounted) while this create was in flight, so nothing will ever
          // reference this instance.
          disposeNow(resizer)
          created = undefined
          return
        }
        setState({ state: 'ready', resizer: resizer, error: undefined })
      } catch (error) {
        if (isCanceled) return
        setState({ state: 'error', resizer: undefined, error: error as Error })
      }
    }
    load()
    return () => {
      isCanceled = true
      if (created != null) {
        disposeNow(created)
        created = undefined
      }
      setState({ state: 'loading', resizer: undefined, error: undefined })
    }
  }, [channelOrder, dataType, height, pixelLayout, scaleMode, width, enabled])

  return state
}
