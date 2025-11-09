import type { CameraOutput } from './CameraOutput.nitro'
import type { Frame } from '../instances/Frame.nitro'
import type { Sync } from 'react-native-nitro-modules'
import type { NativeThread } from '../frame-processors/NativeThread.nitro'
import type { FrameDroppedReason } from '../common-types/FrameDroppedReason'

export interface CameraFrameOutput extends CameraOutput {
  /**
   * Get the {@linkcode NativeThread} that this {@linkcode CameraFrameOutput}
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
  /**
   * Adds a callback that gets called when a {@linkcode Frame} has been dropped.
   * This often happens if your Frame Callback is taking longer than a frame interval.
   */
  setOnFrameDroppedCallback(
    onFrameDropped: ((reason: FrameDroppedReason) => void) | undefined
  ): void
}
