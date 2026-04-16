import type { CustomType, HybridObject } from 'react-native-nitro-modules'
import type {
  CameraFrameOutput,
  NativeThread,
  NativeThreadFactory,
} from 'react-native-vision-camera'

type CustomQueue = object
export type WorkletQueue = CustomType<
  CustomQueue,
  'std::shared_ptr<::worklets::AsyncQueue>',
  {
    canBePassedByReference: true
    include: 'JSIConverter+AsyncQueue.hpp'
  }
>

/**
 * The {@linkcode WorkletQueueFactory} allows creating {@linkcode WorkletQueue}s
 * from {@linkcode NativeThread}s.
 */
export interface WorkletQueueFactory
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Wraps the given {@linkcode NativeThread} in
   * a {@linkcode WorkletQueue}, which can later be
   * used to create a Worklet Runtime that runs on
   * the given {@linkcode NativeThread}.
   *
   * Typically you would use a {@linkcode NativeThread}
   * from an output, such as {@linkcode CameraFrameOutput.thread},
   * but you can also create your own {@linkcode NativeThread}
   * via {@linkcode NativeThreadFactory.createNativeThread | createNativeThread(...)}.
   *
   * @example
   * Creating a Worklet Runtime for a Frame Output's Thread:
   * ```ts
   * const frameOutput = ...
   * const thread = frameOutput.thread
   * const queue = WorkletQueueFactory.wrapThreadInQueue(thread)
   * const runtime = createWorkletRuntime({
   *   name: thread.id,
   *   customQueue: workletQueue,
   *   useDefaultQueue: false,
   * })
   * ```
   * @example
   * Creating a Worklet Runtime for a custom Thread:
   * ```ts
   * const thread = NativeThreadFactory.createNativeThread('my-thread')
   * const queue = WorkletQueueFactory.wrapThreadInQueue(thread)
   * const runtime = createWorkletRuntime({
   *   name: thread.id,
   *   customQueue: workletQueue,
   *   useDefaultQueue: false,
   * })
   * ```
   */
  wrapThreadInQueue(thread: NativeThread): WorkletQueue
  /**
   * Get a C++ Thread's incrementing marker.
   *
   * The first thread that calls this gets `1`.
   * The second thread that calls this gets `2`.
   * If the first thread calls it again, it gets `1` again.
   *
   * This is useful for rendering libraries that are
   * Thread-confined (like OpenGL) to ensure state is
   * cached per-Thread.
   *
   * A Thread Marker does not correlate to modern
   * queues - a `DispatchQueue` might use multiple
   * Threads from a pool, and therefore has
   * different Thread Markers.
   */
  getCurrentThreadMarker(): number
}
