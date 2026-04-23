import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Represents the physical position of a {@linkcode CameraDevice} on the device.
 * - `'front'`: The Camera is located on the front of the device, typically used for selfies.
 * - `'back'`: The Camera is located on the back of the device, typically used for capturing the scene.
 * - `'external'`: The Camera is an external Camera (e.g. USB, Continuity Camera).
 * - `'unspecified'`: The Camera's position is unknown or not applicable.
 */
export type CameraPosition = 'front' | 'back' | 'external' | 'unspecified'
