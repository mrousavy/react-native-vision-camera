import type { HybridObject } from 'react-native-nitro-modules'
import type { Photo } from '../instances/Photo.nitro'
import type { CameraPhotoOutput } from '../outputs/CameraPhotoOutput.nitro'
import type { CameraVideoOutput } from '../outputs/CameraVideoOutput.nitro'

/**
 * Represents the physical Location, in real world
 * coordinates ({@linkcode latitude}, {@linkcode longitude}).
 *
 * Location tags can be embedded into captured {@linkcode Photo | Photos}
 * via EXIF tags, or into captured Videos via MP4/QuickTime
 * flags.
 *
 * VisionCamera core does not provide a way to get a user's
 * location. Instead, use the `react-native-vision-camera-location`
 * module.
 *
 * @see {@linkcode CameraPhotoOutput}
 * @see {@linkcode CameraVideoOutput}
 * @example
 * Embedding a Location in a Photo's EXIF tags:
 * ```ts
 * const photoOutput = ...
 * const location = ...
 * await photoOutput.capturePhoto({
 *   location: location
 * }, {})
 * ```
 */
export interface Location
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Represents the horizontal latitude.
   */
  readonly latitude: number
  /**
   * Represents the horizontal longitude.
   */
  readonly longitude: number
  /**
   * Represents the vertical altitude.
   */
  readonly altitude: number
  /**
   * Represents the accuracy of the horizontal
   * coordinates ({@linkcode latitude} and
   * {@linkcode longitude}) in meters.
   */
  readonly horizontalAccuracy: number
  /**
   * Represents the accuracy of the vertical
   * coordinate ({@linkcode altitude}) in meters.
   */
  readonly verticalAccuracy: number
  /**
   * Represents the timestamp this
   * {@linkcode Location} was captured at,
   * as a UNIX timestamp in milliseconds
   * since 1970.
   */
  readonly timestamp: number
  /**
   * Represents whether this {@linkcode Location}
   * is a mocked location, e.g. from a testing
   * environment or spoofed.
   */
  readonly isMock: boolean
}
