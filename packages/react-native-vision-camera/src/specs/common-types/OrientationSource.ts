import type { Orientation } from './Orientation'

/**
 * Represents the source of an {@linkcode Orientation}.
 * - `'interface'`: Uses the UI's orientation for setting output {@linkcode Orientation}.
 * If screen lock lock is on, the output orientation will also be locked to the screen's orientation.
 * - `'device'`: Uses the physical device's orientation for setting output {@linkcode Orientation}.
 * Even if orientation lock is on, orientation will change when the device physically rotates.
 */
export type OrientationSource = 'interface' | 'device'
