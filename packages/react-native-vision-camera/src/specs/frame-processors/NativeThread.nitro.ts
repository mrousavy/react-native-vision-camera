import type { HybridObject } from 'react-native-nitro-modules'
import type { useFrameOutput } from '../../hooks/useFrameOutput'
import type { CameraFrameOutput } from '../outputs/CameraFrameOutput.nitro'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'

/**
 * Represents a native "Thread".
 *
 * A {@linkcode NativeThread} is a JS handle to
 * a native Thread implementation (most commonly,
 * a [`DispatchQueue`](https://developer.apple.com/documentation/dispatch/dispatchqueue)
 * on iOS and an [`Executor`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html)
 * on Android).
 *
 * It can be used to create Worklet Runtimes that run
 * on the given {@linkcode NativeThread}.
 *
 * @discussion
 * You typically do not create instances of {@linkcode NativeThread}
 * yourself, and shouldn't interact with it.
 * Higher level APIs like the {@linkcode useFrameOutput | useFrameOutput(...)}
 * hook already create a JS Worklet Runtime for you.
 *
 * @discussion
 * Some {@linkcode CameraOutput}s (like the {@linkcode CameraFrameOutput})
 * expose their {@linkcode NativeThread} (see {@linkcode CameraFrameOutput.thread})
 * so a JS Worklet Runtime can be created for that {@linkcode NativeThread}
 * to ensure all work is executed on the same Thread.
 *
 * This is relevant for streaming outputs like the
 * {@linkcode CameraFrameOutput} to run synchronous
 * JS functions (like a "Frame Processor") on the same
 * Thread the output is running on, to prevent any Thread
 * hops or synchronization - work can execute fully
 * isolated and uninterrupted from other Runtimes.
 *
 * @discussion
 * A {@linkcode NativeThread} does not guarantee that it uses
 * a single OS Thread. Instead, it may use a Thread Pool.
 * Do not use `static thread_local` caches in C++, as this may
 * break with pooled {@linkcode NativeThread}s. The same
 * concept applies to GCD (`DispatchQueue`) anyways.
 *
 * Even though the {@linkcode NativeThread} may use a Thread pool,
 * it never runs code in parallel - execution is guaranteed
 * to be serial.
 */
export interface NativeThread
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Get this Thread's ID.
   */
  readonly id: string
  /**
   * - When called from JS, nothing changes - this just delays the call.
   * - When called from native, this actually runs the {@linkcode task} on this Thread.
   */
  runOnThread(task: () => void): void
}
