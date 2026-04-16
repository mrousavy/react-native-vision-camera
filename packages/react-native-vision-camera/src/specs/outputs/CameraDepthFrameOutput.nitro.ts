import type { Sync } from 'react-native-nitro-modules'
import type { useDepthOutput } from '../../hooks/useDepthOutput'
import type { FrameDroppedReason } from '../common-types/FrameDroppedReason'
import type { NativeThread } from '../frame-processors/NativeThread.nitro'
import type { Depth } from '../instances/Depth.nitro'
import type { FrameOutputOptions } from './CameraFrameOutput.nitro'
import type { CameraOutput } from './CameraOutput.nitro'

/**
 * Configuration options for a {@linkcode CameraDepthFrameOutput}.
 *
 * @see {@linkcode CameraDepthFrameOutput}
 * @see {@linkcode useDepthOutput | useDepthOutput(...)}
 */
export interface DepthFrameOutputOptions
  extends Pick<
    FrameOutputOptions,
    | 'targetResolution'
    | 'enablePhysicalBufferRotation'
    | 'dropFramesWhileBusy'
    | 'allowDeferredStart'
  > {
  /**
   * Enables or disables depth data filtering to
   * smoothen out uneven spots in the depth map.
   */
  enableFiltering: boolean
}

/**
 * The {@linkcode CameraDepthFrameOutput} allows synchronously streaming
 * {@linkcode Depth} Frames from the Camera, aka "Depth Frame Processing".
 *
 * @see {@linkcode DepthFrameOutputOptions}
 * @see {@linkcode useDepthOutput | useDepthOutput(...)}
 * @example
 * ```ts
 * const depthOutput = useDepthOutput({
 *   onDepth(depth) {
 *     'worklet'
 *     depth.dispose()
 *   }
 * })
 * ```
 */
export interface CameraDepthFrameOutput extends CameraOutput {
  /**
   * Get the {@linkcode NativeThread} that this
   * {@linkcode CameraDepthFrameOutput} is running on.
   * This is the thread that
   * {@linkcode setOnDepthFrameCallback | setOnDepthFrameCallback(...)}
   * callbacks run on.
   */
  readonly thread: NativeThread
  /**
   * Adds a callback that calls the given {@linkcode onDepthFrame} function
   * every time the Camera produces a new {@linkcode Depth}.
   * @note This method has to be called on a Worklet running on this {@linkcode thread}.
   */
  setOnDepthFrameCallback(
    onDepthFrame: Sync<(depth: Depth) => boolean> | undefined,
  ): void
  /**
   * Adds a callback that gets called when a {@linkcode Depth} has
   * been dropped.
   * This often happens if your Depth Frame Callback is taking longer
   * than a frame interval.
   */
  setOnDepthFrameDroppedCallback(
    onDepthFrameDropped: ((reason: FrameDroppedReason) => void) | undefined,
  ): void
}
