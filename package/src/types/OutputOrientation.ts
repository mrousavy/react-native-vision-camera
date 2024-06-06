import type { Orientation } from './Orientation'

/**
 * Represents the orientation of the camera outputs.
 *
 * Output orientation can either be automatically calculated (`'device'` or `'preview'`),
 * or fixed to a specific orientation ({@linkcode Orientation}).
 */
export type OutputOrientation = 'device' | 'preview' | Orientation
