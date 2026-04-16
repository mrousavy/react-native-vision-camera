import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../specs/CameraController.nitro'
import type { ListenerSubscription } from '../specs/common-types/ListenerSubscription'
import type { NativeThread } from '../specs/frame-processors/NativeThread.nitro'
import type { AsyncRunner } from './AsyncRunner'
import type { RuntimeThread } from './RuntimeThread'

/**
 * Provides an implementation for a separate Runtime/Thread.
 * For example, Worklets.
 */
export interface RuntimeThreadProvider {
  /**
   * Create a new {@linkcode AsyncRunner}. An
   * {@linkcode AsyncRunner} can be used to asynchronously
   * run code in a Frame Processor.
   *
   * @see {@linkcode useAsyncRunner | useAsyncRunner()}
   */
  createAsyncRunner(): AsyncRunner

  /**
   * Creates a new Runtime (exposed as a {@linkcode RuntimeThread})
   * for the given {@linkcode NativeThread}.
   */
  createRuntimeForThread(thread: NativeThread): RuntimeThread

  /**
   * Binds the given {@linkcode SharedValue} to the
   * {@linkcode CameraController} on the UI Thread, and
   * continuously update the controller via the {@linkcode funcName}.
   */
  bindUIUpdatesToController(
    value: SharedValue<number>,
    controller: CameraController,
    funcName: keyof Pick<CameraController, 'setExposureBias' | 'setZoom'>,
  ): ListenerSubscription
}
