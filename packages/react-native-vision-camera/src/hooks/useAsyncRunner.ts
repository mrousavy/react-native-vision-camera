import { useMemo } from 'react'
import { VisionCameraWorkletsProxy } from '../third-party/VisionCameraWorkletsProxy'
import type { AsyncRunner } from '../threading/AsyncRunner'

/**
 * Use an {@linkcode AsyncRunner}.
 * An {@linkcode AsyncRunner} can be used to asynchronously
 * run code in a Frame Processor on a separate, non-blocking
 * Thread.
 * @example
 * ```ts
 * function App() {
 *   const asyncRunner = useAsyncRunner()
 *   const frameOutput = useFrameOutput({
 *     onFrame(frame) {
 *       'worklet'
 *       const wasHandled = asyncRunner.runAsync(() => {
 *         'worklet'
 *         doSomeHeavyProcessing(frame)
 *         // Async task finished - dispose the Frame now.
 *         frame.dispose()
 *       })
 *
 *       if (!wasHandled) {
 *         // `asyncRunner` is busy - drop this Frame!
 *         frame.dispose()
 *       }
 *     }
 *   })
 * }
 * ```
 */
export function useAsyncRunner(): AsyncRunner {
  return useMemo(() => VisionCameraWorkletsProxy.createAsyncRunner(), [])
}
