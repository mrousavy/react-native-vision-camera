import type { DepthPixelFormat } from './DepthPixelFormat'
import type { VideoPixelFormat } from './VideoPixelFormat'

/**
 * Represents any kind of pixel format for a media sample.
 * - {@linkcode VideoPixelFormat}
 * - {@linkcode DepthPixelFormat}
 */
export type PixelFormat = VideoPixelFormat | DepthPixelFormat
