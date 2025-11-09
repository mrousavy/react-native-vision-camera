/**
 * Represents the pixel format of a depth image buffer.
 * - `depth-32-bit`: Depth (1 Grey) 16-bit Float
 * - `depth-16-bit`: Depth (1 Grey) 32-bit Float
 * - `disparity-16-bit`: Disparity (1 Grey) 16-bit Float
 * - `disparity-32-bit`: Disparity (1 Grey) 32-bit Float
 * - `unknown`: An unknown format.
 */
export type DepthPixelFormat =
  | 'depth-32-bit'
  | 'depth-16-bit'
  | 'disparity-16-bit'
  | 'disparity-32-bit'
  | 'unknown'

/**
 * Represents a desired/target {@linkcode DepthPixelFormat}.
 *
 * It can either be a value from {@linkcode DepthPixelFormat} (except for `unknown`),
 * or `native`, in which case the device's default native pixel format will be
 * selected.
 */
export type TargetDepthPixelFormat =
  | 'native'
  | Exclude<DepthPixelFormat, 'unknown'>
