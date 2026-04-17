import type { CommonDynamicRanges } from '../../utils/CommonDynamicRanges'
import type { CameraDevice } from '../inputs/CameraDevice.nitro'
import type { CameraVideoOutput } from '../outputs/CameraVideoOutput.nitro'
import type { Constraint, VideoDynamicRangeConstraint } from './Constraint'

export type ColorSpace =
  | 'srgb'
  | 'dolby-vision'
  | 'p3-d65'
  | 'hlg-bt2020'
  | 'apple-log'
  | 'apple-log-2'
  | 'unknown'

/**
 * Represents the bit-depth of a {@linkcode DynamicRange}.
 *
 * - `'sdr-8-bit'`: Uses 8 bits per channel, often called "SDR"
 * - `'hdr-10-bit'`: Uses 10 bits per channel, often called "HDR"
 */
export type DynamicRangeBitDepth = 'sdr-8-bit' | 'hdr-10-bit' | 'unknown'
/**
 * Represents the range of YUV color components.
 *
 * - `'video'`: Limited Color Range, Y ranges from 16–235 and UV ranges from 16–240
 * - `'full'`: Full Color Range, both Y and UV range from 0-255.
 */
export type ColorRange = 'video' | 'full' | 'unknown'
/**
 * Represents a Dynamic Range, often used for recording
 * HDR videos using a {@linkcode CameraVideoOutput}.
 *
 * @discussion
 * To get all available {@linkcode DynamicRange}s on a
 * device, use {@linkcode CameraDevice.supportedVideoDynamicRanges}.
 *
 * @discussion
 * To use a specific {@linkcode DynamicRange} in a
 * Camera session, use a {@linkcode VideoDynamicRangeConstraint}.
 */
export interface DynamicRange {
  /**
   * The bit-depth for the dynamic range.
   * Often 8-bit or 10-bit.
   */
  bitDepth: DynamicRangeBitDepth
  /**
   * The color-space for the dynamic range.
   *
   * SDR is often composed of `srgb` and `p3-d65`,
   * and HDR is often composed of `hlg-bt2020`.
   */
  colorSpace: ColorSpace
  /**
   * The range of YUV color components.
   */
  colorRange: ColorRange
}

export type TargetColorSpace = Exclude<ColorSpace, 'unknown'>
export type TargetDynamicRangeBitDepth = Exclude<
  DynamicRangeBitDepth,
  'unknown'
>
export type TargetColorRange = Exclude<ColorRange, 'unknown'>
/**
 * Represents a target {@linkcode DynamicRange}, for
 * example to be used with the Constraints API.
 *
 * @see {@linkcode Constraint}
 * @see {@linkcode CommonDynamicRanges}
 */
export interface TargetDynamicRange {
  bitDepth: TargetDynamicRangeBitDepth
  colorSpace: TargetColorSpace
  colorRange: TargetColorRange
}
