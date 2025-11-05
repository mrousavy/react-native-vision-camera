import type { CameraSessionOutput } from './CameraSessionOutput.nitro'
import type { Frame } from '../Frame.nitro'
import type { Sync } from 'react-native-nitro-modules'
import type { NativeThread } from '../frame-processors/NativeThread.nitro'

export interface CameraSessionFrameOutput extends CameraSessionOutput {
  /**
   * Get the {@linkcode NativeThread} that this {@linkcode CameraSessionFrameOutput}
   * is running on.
   * This is the thread that {@linkcode onFrame} will be called on.
   */
  readonly thread: NativeThread
  /**
   * Adds a callback that calls the given {@linkcode onFrame} function
   * every time the Camera produces a new {@linkcode Frame}.
   *
   * As the callback is {@linkcode Sync}, it has to be callback on a Worklet
   * that is running on this {@linkcode thread}.
   */
  setOnFrameCallback(onFrame: Sync<(frame: Frame) => boolean> | undefined): void
}
