import type { HybridObject } from 'react-native-nitro-modules'
import type { NativeThread } from './NativeThread.nitro'

/**
 * A factory for creating {@linkcode NativeThread}s.
 *
 * Typically you would never need this as Camera Outputs
 * create {@linkcode NativeThread}s.
 *
 * You can create {@linkcode NativeThread}s for advanced
 * asynchronous processing on a Worklet Queue, in which
 * case VisionCamera prepares the necessary setup
 * such as installing a Dispatcher to your Worklet
 * Runtime.
 */
export interface NativeThreadFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Create a new {@linkcode NativeThread}.
   *
   * A {@linkcode NativeThread} can be used for Camera operations
   * such as Frame Processing. It uses platform native dispatching
   * mechanisms like `DispatchQueue` or `CoroutineContext`.
   *
   * You can use the `WorkletQueueFactory` from
   * react-native-vision-camera-worklets to wrap the
   * {@linkcode NativeThread} in a `WorkletQueue`,
   * which allows you to run JS code on the thread.
   *
   * @example
   * Creating a Worklet Runtime using this `NativeThread`:
   * ```ts
   * const thread = NativeThreadFactory.createNativeThread('async-processor')
   * const runtime = createWorkletRuntimeForThread(thread)
   * ```
   */
  createNativeThread(name: string): NativeThread
}
