/**
 * Represents the pixel format of a `Frame`.
 * - `yuv`: Frame is in YUV pixel-format (_Bi-Planar Component Y'CbCr 8-bit 4:2:0, either full-range (luma=[0,255] chroma=[1,255]) or video-range (luma=[16,235]_)
 * - `rgb`: Frame is in RGB pixel-format (BGRA 8-bit)
 * - `unknown`: Frame has unknown pixel-format.
 */
export type PixelFormat = 'yuv' | 'rgb' | 'unknown';
