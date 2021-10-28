/**
 * Represents the pixel format of a `Frame`.
 * * `420v`: 420 YpCbCr 8 Bi-Planar Video Range
 * * `420f`: 420 YpCbCr 8 Bi-Planar Full Range
 * * `x420`: 420 YpCbCr 10 Bi-Planar Video Range
 */
export type PixelFormat = '420f' | '420v' | 'x420';
