import type { CameraFactory } from '../CameraFactory.nitro'
import type { Constraint } from '../common-types/Constraint'
import type { CameraDevice } from '../inputs/CameraDevice.nitro'
import type { CameraOutputConfiguration } from './CameraOutputConfiguration'
import type { CameraSessionConfig } from './CameraSessionConfig.nitro'

/**
 * Specifies a single Camera input stream connection
 * streaming into zero or more outputs.
 */
export interface CameraSessionConnection {
  /**
   * The input device of this {@linkcode CameraSessionConnection}.
   * This {@linkcode CameraDevice} will stream into all given
   * {@linkcode outputs}.
   */
  input: CameraDevice
  /**
   * All output configurations that the given {@linkcode input}
   * device will stream into.
   */
  outputs: CameraOutputConfiguration[]
  /**
   * Constraints specifically for this connection.
   */
  constraints: Constraint[]
  /**
   * Sets the initial {@linkcode CameraController.zoom | zoom}
   * value for the {@linkcode CameraController}.
   *
   * This value can later be adjusted
   * via {@linkcode CameraController.setZoom | CameraController.setZoom(...)}.
   */
  initialZoom?: number
  /**
   * Sets the initial {@linkcode CameraController.exposureBias | exposureBias}
   * value for the {@linkcode CameraController}.
   *
   * This value can later be adjusted
   * via {@linkcode CameraController.setExposureBias | CameraController.setExposureBias(...)}.
   */
  initialExposureBias?: number

  /**
   * A callback that will be called after the given {@linkcode constraints} have
   * been fully resolved, and a valid {@linkcode CameraSessionConfig} has been
   * constructed.
   *
   * This is equivalent to calling {@linkcode CameraFactory.resolveConstraints | CameraFactory.resolveConstraints(...)}
   * with the {@linkcode input}, {@linkcode outputs} and {@linkcode constraints} listed here.
   *
   * @discussion
   * The given {@linkcode config} can be used to provide visual feedback in
   * Camera apps where buttons have to be greyed out when they are not supported,
   * e.g. when passing a HDR {@linkcode Constraint} but the session didn't end up
   * selecting a {@linkcode CameraSessionConfig.selectedVideoDynamicRange}, or
   * when requesting slow-motion but the session didn't end up selecting a
   * {@linkcode CameraSessionConfig.selectedVideoRecordingMode}.
   */
  onSessionConfigSelected?: (config: CameraSessionConfig) => void
}
