import type { CameraDevice } from '../inputs/CameraDevice.nitro'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'

/**
 * Represents the type of an output stream,
 * often related to {@linkcode CameraOutput}.
 *
 * This is used for getting available resolutions for a given
 * {@linkcode OutputStreamType} via
 * {@linkcode CameraDevice.getSupportedResolutions | CameraDevice.getSupportedResolutions(...)}
 */
export type OutputStreamType =
  | 'photo'
  | 'video'
  | 'stream'
  | 'depth-photo'
  | 'depth-stream'
