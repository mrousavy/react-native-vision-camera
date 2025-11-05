import type { PixelFormat } from './PixelFormat'

/**
 * Represents a desired/target {@linkcode PixelFormat}.
 *
 * It can either be a value from {@linkcode PixelFormat} (except for `unknown`),
 * or `native`, in which case the device's default native pixel format will be
 * selected.
 */
export type TargetPixelFormat = 'native' | Exclude<PixelFormat, 'unknown'>
