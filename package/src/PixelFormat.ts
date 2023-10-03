/**
 * Represents the pixel format of a `Frame`.
 *
 * If you intend to read Pixels from this Frame or use an ML model for processing, make sure that you are
 * using the expected `PixelFormat`, otherwise the plugin might not be able to properly understand the Frame's content.
 *
 * Most ML models operate in either `yuv` (recommended) or `rgb`.
 *
 * - `yuv`: Frame is in YUV pixel-format (Y'CbCr 4:2:0 or NV21, 8-bit)
 * - `rgb`: Frame is in RGB pixel-format (RGB or RGBA, 8-bit)
 * - `native`: Frame is in the Camera's native Hardware Buffer format (PRIVATE). This is the most efficient Format.
 * - `unknown`: Frame has unknown/unsupported pixel-format.
 */
export type PixelFormat = 'yuv' | 'rgb' | 'native' | 'unknown'
