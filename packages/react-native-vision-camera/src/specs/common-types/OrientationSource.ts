import type { CameraOrientation } from './CameraOrientation'

/**
 * Represents the source of a {@linkcode CameraOrientation}.
 * - `'interface'`: Uses the UI's orientation for setting output {@linkcode CameraOrientation}.
 * If screen lock lock is on, the output orientation will also be locked to the screen's orientation.
 * - `'device'`: Uses the physical device's orientation for setting output {@linkcode CameraOrientation}.
 * Even if orientation lock is on, orientation will change when the device physically rotates.
 */
export type OrientationSource = 'interface' | 'device'
