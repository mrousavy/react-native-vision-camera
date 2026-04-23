import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Represents the focus mode of a {@linkcode CameraDevice}.
 * - `'locked'`: The lens position is locked at its current value and does not adapt to scene changes.
 * - `'auto-focus'`: The lens is adjusted once to focus the current scene.
 * - `'continuous-auto-focus'`: The lens is continuously adjusted as the scene changes.
 */
export type FocusMode = 'locked' | 'auto-focus' | 'continuous-auto-focus'
