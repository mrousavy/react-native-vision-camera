import type { Image } from 'react-native-nitro-image'
import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOrientation } from '../common-types/CameraOrientation'
import type { PixelFormat } from '../common-types/PixelFormat'
import type { Depth } from '../instances/Depth.nitro'
import type { Frame } from '../instances/Frame.nitro'

/**
 * The {@linkcode FrameConverter} can convert {@linkcode Frame}s
 * and {@linkcode Depth} to {@linkcode Image}s, and back.
 */
export interface FrameConverter
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  // Frame -> Image converter
  /**
   * Converts the given {@linkcode Frame} to an {@linkcode Image}.
   * This performs a CPU copy.
   *
   * @throws If the Frame is invalid ({@linkcode Frame.isValid}).
   */
  convertFrameToImage(frame: Frame): Image
  /**
   * Asynchronously converts this {@linkcode Frame} to an
   * {@linkcode Image}.
   * This performs a CPU copy.
   *
   * @throws If the Frame is invalid ({@linkcode Frame.isValid}).
   */
  convertFrameToImageAsync(frame: Frame): Promise<Image>

  // Image -> Frame converter
  /**
   * Converts the given {@linkcode Image} to a {@linkcode Frame},
   * as if the Camera had streamed it in the given {@linkcode orientation}
   * and {@linkcode isMirrored} mode.
   *
   * This is the inverse of {@linkcode convertFrameToImage | convertFrameToImage(...)};
   * the {@linkcode Image}'s pixel data is physically rotated and mirrored so that
   * interpreting the resulting {@linkcode Frame} with its
   * {@linkcode Frame.orientation | orientation} and
   * {@linkcode Frame.isMirrored | isMirrored} flags yields the original
   * upright {@linkcode Image} again.
   *
   * This performs a CPU copy.
   * The resulting {@linkcode Frame} is in a CPU-accessible, camera-like
   * RGB {@linkcode PixelFormat} ({@linkcode PixelFormat | 'rgb-bgra-8-bit'}
   * on iOS, {@linkcode PixelFormat | 'rgb-rgba-8-bit'} on Android),
   * so the conversion is lossless.
   *
   * @note Since the pixel data is physically rotated, the resulting
   * {@linkcode Frame}'s {@linkcode Frame.width | width} and
   * {@linkcode Frame.height | height} are flipped if {@linkcode orientation}
   * is {@linkcode CameraOrientation | 'left'} or {@linkcode CameraOrientation | 'right'}.
   * @note The resulting {@linkcode Frame} has to be disposed
   * (see {@linkcode Frame.dispose | dispose()}) again to free up its memory.
   *
   * @throws If the Image has already been disposed, or its pixel data cannot be accessed.
   *
   * @example
   * ```ts
   * const image = await loadImage({ filePath: '...' })
   * const frame = HybridFrameConverter.convertImageToFrame(image, 'up', false)
   * console.log(`${frame.width}x${frame.height} ${frame.pixelFormat} Frame`)
   * // process the Frame, e.g. scan it for barcodes or resize it...
   * frame.dispose()
   * ```
   */
  convertImageToFrame(
    image: Image,
    orientation: CameraOrientation,
    isMirrored: boolean,
  ): Frame
  /**
   * Asynchronously converts the given {@linkcode Image} to a
   * {@linkcode Frame}, as if the Camera had streamed it in the
   * given {@linkcode orientation} and {@linkcode isMirrored} mode.
   *
   * This performs a CPU copy.
   *
   * @see {@linkcode convertImageToFrame | convertImageToFrame(...)}
   * @throws If the Image has already been disposed, or its pixel data cannot be accessed.
   */
  convertImageToFrameAsync(
    image: Image,
    orientation: CameraOrientation,
    isMirrored: boolean,
  ): Promise<Frame>

  /**
   * Converts the {@linkcode Depth} frame to an {@linkcode Image}.
   *
   * The resulting {@linkcode Image} will be a grey-scale RGB image,
   * where black pixels are far away, and white pixels are close by.
   */
  convertDepthToImage(depth: Depth): Image
  convertDepthToImageAsync(depth: Depth): Promise<Image>
}
