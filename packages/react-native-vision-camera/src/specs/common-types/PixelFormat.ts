/**
 * Represents the pixel format of the image buffer.
 * - `yuv-420-8-bit-video`: YUV (4:2:0 YpCbCr) 8-bit planar video-range
 * - `yuv-420-8-bit-full`: YUV (4:2:0 YpCbCr) 8-bit planar full-range
 * - `yuv-420-10-bit-video`: YUV (4:2:0 YpCbCr) 10-bit planar video-range
 * - `yuv-420-10-bit-full`: YUV (4:2:0 YpCbCr) 10-bit planar full-range
 * - `rgb-bgra-32-bit`: RGB (32-byte BGRA) 8-bit
 * - `depth-32-bit`: Depth (1 Grey) 16-bit Float
 * - `depth-16-bit`: Depth (1 Grey) 32-bit Float
 * - `disparity-16-bit`: Disparity (1 Grey) 16-bit Float
 * - `disparity-32-bit`: Disparity (1 Grey) 32-bit Float
 * - `unknown`: An unknown format.
 */
export type PixelFormat =
  | 'yuv-420-8-bit-video'
  | 'yuv-420-8-bit-full'
  | 'yuv-420-10-bit-video'
  | 'yuv-420-10-bit-full'
  | 'rgb-bgra-32-bit'
  | 'depth-32-bit'
  | 'depth-16-bit'
  | 'disparity-16-bit'
  | 'disparity-32-bit'
  | 'unknown'
