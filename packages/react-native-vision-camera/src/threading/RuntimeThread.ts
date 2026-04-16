import type { Depth } from '../specs/instances/Depth.nitro'
import type { Frame } from '../specs/instances/Frame.nitro'
import type { CameraDepthFrameOutput } from '../specs/outputs/CameraDepthFrameOutput.nitro'
import type { CameraFrameOutput } from '../specs/outputs/CameraFrameOutput.nitro'

/**
 * An implementation for a separate Runtime/Thread.
 * For example, Worklets.
 */
export interface RuntimeThread {
  setOnFrameCallback(
    frameOutput: CameraFrameOutput,
    callback: ((frame: Frame) => void) | undefined,
  ): void
  setOnDepthFrameCallback(
    depthOutput: CameraDepthFrameOutput,
    callback: ((depth: Depth) => void) | undefined,
  ): void
}
