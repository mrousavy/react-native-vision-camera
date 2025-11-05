import type { CustomType, HybridObject } from 'react-native-nitro-modules'
import type { NativeThread } from './NativeThread.nitro'

type CustomQueue = object
type WorkletQueue = CustomType<
  CustomQueue,
  'std::shared_ptr<worklets::AsyncQueue>',
  {
    canBePassedByReference: true
    include: 'JSIConverter+AsyncQueue.hpp'
  }
>

export interface WorkletQueueFactory extends HybridObject<{ ios: 'c++' }> {
  wrapThreadInQueue(thread: NativeThread): WorkletQueue
}
