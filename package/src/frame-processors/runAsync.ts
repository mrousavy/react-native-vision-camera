import { WorkletsProxy } from '../dependencies/WorkletsProxy'
import type { Frame, FrameInternal } from '../types/Frame'
import { FrameProcessorsUnavailableError } from './FrameProcessorsUnavailableError'
import { throwErrorOnJS } from './throwErrorOnJS'

/**
 * A synchronized Shared Value to indicate whether the async context is currently executing
 */
let isAsyncContextBusy: { value: boolean }
/**
 * Runs the given function on the async context, and sets {@linkcode isAsyncContextBusy} to false after it finished executing.
 */
let runOnAsyncContext: (frame: Frame, func: () => void) => void

try {
  const Worklets = WorkletsProxy.Worklets
  isAsyncContextBusy = Worklets.createSharedValue(false)

  const asyncContext = Worklets.createContext('VisionCamera.async')
  runOnAsyncContext = asyncContext.createRunAsync((frame: Frame, func: () => void) => {
    'worklet'
    try {
      // Call long-running function
      func()
    } catch (e) {
      // Re-throw error on JS Thread
      throwErrorOnJS(e)
    } finally {
      // Potentially delete Frame if we were the last ref
      const internal = frame as FrameInternal
      internal.decrementRefCount()

      // free up async context again, new calls can be made
      isAsyncContextBusy.value = false
    }
  })
} catch (e) {
  // react-native-worklets-core is not installed!
  // Just use dummy implementations that will throw when the user tries to use Frame Processors.
  isAsyncContextBusy = { value: false }
  runOnAsyncContext = () => {
    throw new FrameProcessorsUnavailableError(e)
  }
}

/**
 * Runs the given {@linkcode func} asynchronously on a separate thread,
 * allowing the Frame Processor to continue executing without dropping a Frame.
 *
 * Only one {@linkcode runAsync} call will execute at the same time,
 * so {@linkcode runAsync} is **not parallel**, **but asynchronous**.
 *
 *
 * For example, if your Camera is running at 60 FPS (16ms per frame), and a
 * heavy ML face detection Frame Processor Plugin takes 500ms to execute,
 * you have two options:
 * - Run the plugin normally (synchronously in `useFrameProcessor`)
 * but drop a lot of Frames, as we can only run at 2 FPS (500ms per frame)
 * - Call the plugin inside {@linkcode runAsync} to allow the Camera to still
 * run at 60 FPS, but offload the heavy ML face detection plugin to the
 * asynchronous context, where it will run at 2 FPS.
 *
 * @note {@linkcode runAsync} cannot be used to draw to a Frame in a Skia Frame Processor.
 * @param frame The current Frame of the Frame Processor.
 * @param func The function to execute.
 * @worklet
 * @example
 *
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log('New Frame arrived!')
 *
 *   runAsync(frame, () => {
 *     'worklet'
 *     const faces = detectFaces(frame)
 *     const face = [faces0]
 *     console.log(`Detected a new face: ${face}`)
 *   })
 * })
 * ```
 */
export function runAsync(frame: Frame, func: () => void): void {
  'worklet'

  if (isAsyncContextBusy.value) {
    // async context is currently busy, we cannot schedule new work in time.
    // drop this frame/runAsync call.
    return
  }

  // Increment ref count by one
  const internal = frame as FrameInternal
  internal.incrementRefCount()

  isAsyncContextBusy.value = true

  // Call in separate background context
  runOnAsyncContext(frame, func)
}
