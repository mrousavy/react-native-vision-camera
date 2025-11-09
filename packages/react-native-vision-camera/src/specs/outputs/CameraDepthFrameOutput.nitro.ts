import type { CameraOutput } from './CameraOutput.nitro'
import type { Sync } from 'react-native-nitro-modules'
import type { NativeThread } from '../frame-processors/NativeThread.nitro'
import type { Depth } from '../instances/Depth.nitro'
import type { FrameDroppedReason } from '../common-types/FrameDroppedReason'

export interface CameraDepthFrameOutput extends CameraOutput {
  /**
   * Get the {@linkcode NativeThread} that this
   * {@linkcode CameraDepthFrameOutput} is running on.
   * This is the thread that {@linkcode onDepthFrame} will be called on.
   */
  readonly thread: NativeThread
  /**
   * Adds a callback that calls the given {@linkcode onFrame} function
   * every time the Camera produces a new {@linkcode Depth}.
   *
   * As the callback is {@linkcode Sync}, it has to be callback on a Worklet
   * that is running on this {@linkcode thread}.
   */
  setOnDepthFrameCallback(
    onDepthFrame: Sync<(depth: Depth) => boolean> | undefined
  ): void
  /**
   * Adds a callback that gets called when a {@linkcode Depth} has
   * been dropped.
   * This often happens if your Depth Frame Callback is taking longer
   * than a frame interval.
   */
  setOnDepthFrameDroppedCallback(
    onDepthFrameDropped: ((reason: FrameDroppedReason) => void) | undefined
  ): void
}
