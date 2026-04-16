/**
 * Represents how the three output channels are ordered in memory.
 *
 * For example, `'rgb'` stores one pixel as `R, G, B`.
 */
export type ChannelOrder = 'rgb' | 'bgr'

/**
 * Represents how the individual channels per pixel are arranged in memory.
 *
 * - `'interleaved'` stores complete pixels next to each other, which corresponds to (N)HWC:
 *     ```text
 *     RGBRGBRGBRGB
 *     RGBRGBRGBRGB
 *     RGBRGBRGBRGB
 *     ```
 * - `'planar'` stores one full channel plane after the other, which corresponds to (N)CHW:
 *     ```text
 *     RRRRRRRRRRRR
 *     GGGGGGGGGGGG
 *     BBBBBBBBBBBB
 *     ```
 */
export type PixelLayout = 'interleaved' | 'planar'

/**
 * Represents the scalar encoding used for each output channel.
 *
 * For example, `'float32'` stores each output value as a 32-bit float
 * in the normalized range from `0.0` to `1.0`.
 */
export type DataType = 'int8' | 'uint8' | 'float16' | 'float32'
