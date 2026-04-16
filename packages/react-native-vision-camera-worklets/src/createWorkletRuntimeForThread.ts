import type { NativeThread } from 'react-native-vision-camera'
import {
  createWorkletRuntime,
  type WorkletRuntime,
} from 'react-native-worklets'
import { HybridWorkletQueueFactory } from './internal/HybridWorkletQueueFactory'

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
