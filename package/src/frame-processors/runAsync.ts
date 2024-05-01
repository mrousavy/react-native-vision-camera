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
 * Runs the given function asynchronously, while keeping a strong reference to the Frame.
 *
 * For example, if you want to run a heavy face detection algorithm
 * while still drawing to the screen at 60 FPS, you can use `runAsync(...)`
 * to offload the face detection algorithm to a separate thread.
 *
 * @param frame The current Frame of the Frame Processor.
 * @param func The function to execute.
 * @worklet
 * @example
 *
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log('New Frame')
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
