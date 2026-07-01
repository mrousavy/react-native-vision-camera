import type { Frame } from '../instances/Frame.nitro'
import type { CameraFrameOutput } from '../outputs/CameraFrameOutput.nitro'
import type { PixelFormat } from './PixelFormat'

/**
 * Represents the pixel format of a video image buffer.
 * Video Formats are either **YUV** or **RGB**.
 * The most commonly used format is `yuv-420-8-bit-video`.
 *
 * | Format                      | Colorspace | Sampling | Bit depth | Color Range  | Layout               |
 * |-----------------------------|------------|----------|-----------|--------------|----------------------|
 * | `yuv-420-8-bit-video`       | YUV        | 4:2:0    | 8-bit     | Video        | Planar               |
 * | `yuv-420-8-bit-full`        | YUV        | 4:2:0    | 8-bit     | Full         | Planar               |
 * | `yuv-420-10-bit-video`      | YUV        | 4:2:0    | 10-bit    | Video        | Planar               |
 * | `yuv-420-10-bit-full`       | YUV        | 4:2:0    | 10-bit    | Full         | Planar               |
 * | `yuv-422-8-bit-video`       | YUV        | 4:2:2    | 8-bit     | Video        | Planar               |
 * | `yuv-422-8-bit-full`        | YUV        | 4:2:2    | 8-bit     | Full         | Planar               |
 * | `yuv-422-10-bit-video`      | YUV        | 4:2:2    | 10-bit    | Video        | Planar               |
 * | `yuv-422-10-bit-full`       | YUV        | 4:2:2    | 10-bit    | Full         | Planar               |
 * | `yuv-444-8-bit-video`       | YUV        | 4:4:4    | 8-bit     | Video        | Planar               |
 * | `yuv-444-8-bit-full`        | YUV        | 4:4:4    | 8-bit     | Full         | Planar               |
 * | `rgb-bgra-8-bit`            | RGB        | 4:4:4    | 8-bit     | Full         | Interleaved BGRA     |
 * | `rgb-rgba-8-bit`            | RGB        | 4:4:4    | 8-bit     | Full         | Interleaved RGBA     |
 * | `rgb-rgb-8-bit`             | RGB        | 4:4:4    | 8-bit     | Full         | Interleaved RGB/RGBX |
 * | `raw-bayer-packed96-12-bit` | RAW Bayer  | Mosaic   | 12-bit    | Sensor       | Packed96 Bayer       |
 * | `raw-bayer-unpacked-16-bit` | RAW Bayer  | Mosaic   | 16-bit    | Sensor       | Unpacked 16-bit      |
 * | `unknown`                   | —          | —        | —         | —            | Unknown              |
 */
export type VideoPixelFormat =
  | 'yuv-420-8-bit-video'
  | 'yuv-420-8-bit-full'
  | 'yuv-420-10-bit-video'
  | 'yuv-420-10-bit-full'
  | 'yuv-422-8-bit-video'
  | 'yuv-422-8-bit-full'
  | 'yuv-422-10-bit-video'
  | 'yuv-422-10-bit-full'
  | 'yuv-444-8-bit-video'
  | 'yuv-444-8-bit-full'
  | 'rgb-bgra-8-bit'
  | 'rgb-rgba-8-bit'
  | 'rgb-rgb-8-bit'
  | 'raw-bayer-packed96-12-bit'
  | 'raw-bayer-unpacked-16-bit'
  | 'unknown'

/**
 * Represents a desired pixel format for a video
 * pipeline.
 *
 * Used to configure the format a {@linkcode CameraFrameOutput}
 * streams {@linkcode Frame}s in.
 *
 * - `'native'`: Choose whatever the {@linkcode CameraSessionConfig}'s
 *    {@linkcode CameraSessionConfig.nativePixelFormat | nativePixelFormat} is. This can be a YUV format,
 *    an RGB format like {@linkcode VideoPixelFormat | 'rgb-bgra-8-bit'}, a RAW format like
 *    {@linkcode VideoPixelFormat | 'raw-bayer-packed96-12-bit'}, or a private
 *    format ({@linkcode PixelFormat | 'private'}) and requires zero conversion.
 * - `'yuv'`: Choose the YUV format closest to the Camera's native format. Often YUV 4:2:0
 *    8-bit full-range like {@linkcode VideoPixelFormat | 'yuv-420-8-bit-full'}.
 * - `'yuv-420-8-bit-full'`: Explicitly choose YUV 4:2:0 8-bit **full-range**
 *    ({@linkcode VideoPixelFormat | 'yuv-420-8-bit-full'}). Full-range is often preferred
 *    for CPU-based processing (e.g. ML inference).
 * - `'yuv-420-8-bit-video'`: Explicitly choose YUV 4:2:0 8-bit **video-range**
 *    ({@linkcode VideoPixelFormat | 'yuv-420-8-bit-video'}). Video-range is required by
 *    some GPU video pipelines, for example WebGPU (Dawn) can only import video-range
 *    YUV buffers as external textures.
 * - `'rgb'`: Choose an RGB format. Often 8-bit BGRA like
 *   {@linkcode VideoPixelFormat | 'rgb-bgra-8-bit'}.
 *
 * Note: On Android, `'yuv-420-8-bit-full'` and `'yuv-420-8-bit-video'` both resolve
 * to the same YUV format as `'yuv'` (`YUV_420_888`), as Android does not allow
 * configuring the color range of the Camera output.
 */
export type TargetVideoPixelFormat =
  | 'native'
  | 'yuv'
  | 'yuv-420-8-bit-full'
  | 'yuv-420-8-bit-video'
  | 'rgb'
