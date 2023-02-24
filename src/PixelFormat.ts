/**
 * Represents the pixel format of a `Frame`.
 * * `420v`: 4:2:0 YpCbCr 8-Bit Bi-Planar Video Range
 * * `420f`: 4:2:0 YpCbCr 8-Bit Bi-Planar Full Range
 * * `x420`: 4:2:0 YpCbCr 10-Bit Bi-Planar Video Range (HDR)
 * * `422v`: 4:2:2 YpCbCr 8-Bit Bi-Planar Video Range
 * * `444v`: 4:4:4 YpCbCr 8-Bit Bi-Planar Video Range
 */
export type PixelFormat = '420v' | '420f' | 'x420' | '422v' | '444v';
