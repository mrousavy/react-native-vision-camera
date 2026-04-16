import type { DepthPixelFormat } from './DepthPixelFormat'
import type { VideoPixelFormat } from './VideoPixelFormat'

/**
 * Represents any kind of pixel format for a media sample.
 * - {@linkcode VideoPixelFormat}: A video-based Format
 * - {@linkcode DepthPixelFormat}: A depth/disparity-based Format
 * - `'private'`: An implementation-defined private Format, possibly only allowing GPU access.
 */
export type PixelFormat = VideoPixelFormat | DepthPixelFormat | 'private'
