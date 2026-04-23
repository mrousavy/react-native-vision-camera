import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Represents the white balance mode of a {@linkcode CameraDevice}.
 * - `'locked'`: The white balance is locked at its current value and does not adapt to scene changes.
 * - `'auto-white-balance'`: The white balance is adjusted once to match the current scene.
 * - `'continuous-auto-white-balance'`: The white balance is continuously adjusted as the scene changes.
 */
export type WhiteBalanceMode =
  | 'locked'
  | 'auto-white-balance'
  | 'continuous-auto-white-balance'
