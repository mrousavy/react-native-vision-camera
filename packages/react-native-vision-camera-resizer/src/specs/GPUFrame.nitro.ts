import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame } from 'react-native-vision-camera'
import type { ChannelOrder, DataType, PixelLayout } from './OutputFormat'
import type { Resizer } from './Resizer.nitro'

/**
 * A {@linkcode GPUFrame} represents a texture on the GPU,
 * often the result of a {@linkcode Frame} that has been
 * resized with the {@linkcode Resizer}.
 *
 * The {@linkcode GPUFrame} exposes its underlying pixel
 * buffer to the CPU via {@linkcode getPixelBuffer | getPixelBuffer()}.
 *
 * @discussion
 * It is recommended to {@linkcode dispose | dispose()} the
 * {@linkcode GPUFrame} once it is no longer used to free
 * up resources as early as possible.
 */
export interface GPUFrame
  extends HybridObject<{ ios: 'swift'; android: 'c++' }> {
  /**
   * Represents the width of the {@linkcode GPUFrame}, in pixels.
   *
   * @note If the {@linkcode GPUFrame} has already been disposed, this returns `0`.
   */
  readonly width: number
  /**
   * Represents the height of the {@linkcode GPUFrame}, in pixels.
   *
   * @note If the {@linkcode GPUFrame} has already been disposed, this returns `0`.
   */
  readonly height: number
  /**
   * Represents the channel ordering of the {@linkcode GPUFrame}.
   *
   * @note If the {@linkcode GPUFrame} has already been disposed, this returns `undefined`.
   */
  readonly channelOrder?: ChannelOrder
  /**
   * Represents the scalar data type of the {@linkcode GPUFrame}.
   *
   * @note If the {@linkcode GPUFrame} has already been disposed, this returns `undefined`.
   */
  readonly dataType?: DataType
  /**
   * Represents how the {@linkcode GPUFrame}'s channels are laid out in memory.
   *
   * - `'interleaved'` corresponds to HWC / NHWC.
   * - `'planar'` corresponds to CHW / NCHW.
   *
   * @note If the {@linkcode GPUFrame} has already been disposed, this returns `undefined`.
   */
  readonly pixelLayout?: PixelLayout
  /**
   * Get an `ArrayBuffer` representing the shared memory of this {@linkcode GPUFrame}.
   *
   * While the `ArrayBuffer` allows reading pixels in JS, it is a GPU
   * buffer, and reads are expected to be performed on the GPU for better
   * performance.
   *
   * @discussion
   * The returned `ArrayBuffer` is only valid as long as this {@linkcode GPUFrame}
   * is valid - once the {@linkcode GPUFrame} has been {@linkcode dispose | dispose()}'d,
   * the returned `ArrayBuffer` is no longer safe to access and may return "garbage data".
   */
  getPixelBuffer(): ArrayBuffer
}
