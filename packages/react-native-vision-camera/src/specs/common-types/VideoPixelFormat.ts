/**
 * Represents the pixel format of a video image buffer.
 * - `yuv-420-8-bit-video`: YUV (4:2:0 YpCbCr) 8-bit planar video-range
 * - `yuv-420-8-bit-full`: YUV (4:2:0 YpCbCr) 8-bit planar full-range
 * - `yuv-420-10-bit-video`: YUV (4:2:0 YpCbCr) 10-bit planar video-range
 * - `yuv-420-10-bit-full`: YUV (4:2:0 YpCbCr) 10-bit planar full-range
 * - `yuv-422-10-bit-video`: YUV (4:2:2 YpCbCr) 10-bit planar video-range
 * - `yuv-422-10-bit-full`: YUV (4:2:2 YpCbCr) 10-bit planar full-range
 * - `rgb-bgra-32-bit`: RGB (32-byte BGRA) 8-bit
 * - `unknown`: An unknown format.
 */
export type VideoPixelFormat =
  | 'yuv-420-8-bit-video'
  | 'yuv-420-8-bit-full'
  | 'yuv-420-10-bit-video'
  | 'yuv-420-10-bit-full'
  | 'yuv-422-10-bit-video'
  | 'yuv-422-10-bit-full'
  | 'rgb-bgra-32-bit'
  | 'unknown'

/**
 * Represents a desired/target {@linkcode VideoPixelFormat}.
 *
 * It can either be a value from {@linkcode VideoPixelFormat} (except for `unknown`),
 * or `native`, in which case the device's default native pixel format will be
 * selected.
 */
export type TargetVideoPixelFormat =
  | 'native'
  | Exclude<VideoPixelFormat, 'unknown'>
