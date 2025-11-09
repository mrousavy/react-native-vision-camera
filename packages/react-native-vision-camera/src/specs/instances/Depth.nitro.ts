import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
import type { Orientation } from '../common-types/Orientation'
import type { Image } from 'react-native-nitro-image'
import type { CameraCalibrationData } from './CameraCalibrationData.nitro'
import type { DepthPixelFormat } from '../common-types/DepthPixelFormat'

export type AuxilaryDepthType = 'depth' | 'disparity'
export type DepthDataAccuracy = 'relative' | 'accurate'
export type DepthDataQuality = 'low' | 'high'

export interface Depth extends HybridObject<{ ios: 'swift' }> {
  /**
   * Gets the {@linkcode DepthPixelFormat} of this {@linkcode Depth} Frame's
   * pixel data.
   * Common formats are {@linkcode DepthPixelFormat | 'depth-16'}
   * for depth frames, or {@linkcode DepthPixelFormat | 'disparity-16'}
   * for disparity frames.
   *
   * @note If this {@linkcode Depth} frame is invalid ({@linkcode isValid}),
   * this just returns {@linkcode DepthPixelFormat | 'unknown'}.
   */
  readonly pixelFormat: DepthPixelFormat
  readonly timestamp: number
  readonly isValid: boolean
  readonly isDepthDataFiltered: boolean
  readonly depthDataAccuracy: DepthDataAccuracy
  readonly depthDataQuality: DepthDataQuality
  readonly availableDepthPixelFormats: DepthPixelFormat[]
  readonly cameraCalibrationData?: CameraCalibrationData
  readonly orientation: Orientation
  /**
   * Returns a derivative {@linkcode Depth} frame by rotating
   * it to the specified {@linkcode orientation}, and potentially
   * mirroring it.
   */
  rotate(orientation: Orientation, isMirrored: boolean): Depth
  rotateAsync(orientation: Orientation, isMirrored: boolean): Promise<Depth>
  /**
   * Converts this {@linkcode Depth} frame to the target {@linkcode pixelFormat}.
   *
   * The {@linkcode pixelFormat} must be one of the {@linkcode DepthPixelFormat}s
   * returned from {@linkcode availableDepthPixelFormats}.
   */
  convert(pixelFormat: DepthPixelFormat): Depth
  convertAsync(pixelFormat: DepthPixelFormat): Promise<Depth>
  /**
   * Converts this {@linkcode Depth} frame to an {@linkcode Image}.
   *
   * The resulting {@linkcode Image} will be a grey-scale RGB image,
   * where black pixels are far away, and white pixels are close by.
   */
  toImage(): Image
  toImageAsync(): Promise<Image>
  /**
   * Converts this {@linkcode Depth} frame to a dictionary
   * representation suitable for writing into an image file.
   */
  toDictionary(type: AuxilaryDepthType): AnyMap
  toDictionaryAsync(type: AuxilaryDepthType): Promise<AnyMap>
}
