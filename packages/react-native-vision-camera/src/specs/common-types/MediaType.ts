/**
 * Represents the type of a media sample.
 * - `'video'`: A pixel-based format suitable for recordings, each pixel contain a color.
 * - `'depth'`: A pixel-based depth or disparity map, each pixel is a physical distance.
 * - `'metadata'`: An object-based format, like QR codes.
 * - `'other'`: An unknown media format.
 */
export type MediaType = 'video' | 'depth' | 'metadata' | 'other'
