import type { NativeThread } from 'react-native-vision-camera'
import {
  createWorkletRuntime,
  type WorkletRuntime,
} from 'react-native-worklets'
import { HybridWorkletQueueFactory } from './internal/HybridWorkletQueueFactory'

/**
 * Creates a new `WorkletRuntime` that schedules its work on the given
 * {@linkcode NativeThread}.
 *
 * This wraps a Camera-owned {@linkcode NativeThread} in a
 * [react-native-worklets](https://docs.swmansion.com/react-native-worklets/docs/)
 * `WorkletRuntime` so that Worklets (such as Frame Processors) can run directly
 * on the Camera pipeline's thread without context switching.
 */
export function createWorkletRuntimeForThread(
  thread: NativeThread,
): WorkletRuntime {
  const workletQueue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)

  return createWorkletRuntime({
    name: thread.id,
    customQueue: workletQueue,
    useDefaultQueue: false,
    initializer: () => {
      'worklet'
      try {
        // @ts-expect-error `installDispatcher` is a raw JSI Hybrid Method, its untyped.
        HybridWorkletQueueFactory.installDispatcher(thread)
      } catch (e) {
        console.error(`Failed to install global Dispatcher! ${e}`)
      }
    },
  })
}
