/**
 * Represents the exposure mode of a {@linkcode CameraDevice}.
 * - `'locked'`: The exposure is locked at its current value and does not adapt to scene changes.
 * - `'auto-exposure'`: The exposure is adjusted once to a suitable value for the current scene.
 * - `'continuous-auto-exposure'`: The exposure is continuously adjusted as the scene changes.
 * - `'custom'`: The exposure is manually controlled via custom ISO and shutter speed.
 */
export type ExposureMode =
  | 'locked'
  | 'auto-exposure'
  | 'continuous-auto-exposure'
  | 'custom'
