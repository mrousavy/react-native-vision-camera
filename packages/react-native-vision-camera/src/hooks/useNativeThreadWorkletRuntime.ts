import {
  createWorkletRuntime,
  type WorkletRuntime,
} from 'react-native-worklets'
import type { NativeThread } from '../specs/frame-processors/NativeThread.nitro'
import { useMemo } from 'react'
import { HybridWorkletQueueFactory } from '..'

export function useNativeThreadWorkletRuntime(
  thread: NativeThread
): WorkletRuntime {
  return useMemo(() => {
    const workletQueue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)
    return createWorkletRuntime({
      name: thread.id,
      customQueue: workletQueue,
      useDefaultQueue: false,
    })
  }, [thread])
}
