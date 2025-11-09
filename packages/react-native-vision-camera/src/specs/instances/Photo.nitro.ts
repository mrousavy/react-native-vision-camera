import type { Image } from 'react-native-nitro-image'
import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
import type { Depth } from './Depth.nitro'
import type { Orientation } from '../common-types/Orientation'

export interface Photo extends HybridObject<{ ios: 'swift' }> {
  /**
   * Gets whether this {@linkcode Photo} is mirrored alongside the
   * vertical axis.
   */
  readonly isMirrored: boolean
  readonly orientation: Orientation
  readonly timestamp: number
  readonly isRawPhoto: boolean
  readonly exifMetadata: AnyMap

  readonly hasPixelBuffer: boolean
  getPixelBuffer(): ArrayBuffer

  readonly hasPreviewPixelBuffer: boolean
  getPreviewPixelBuffer(): ArrayBuffer
  toPreviewImage(): Image
  toPreviewImageAsync(): Promise<Image>

  readonly depth?: Depth

  saveToFileAsync(path: string, quality: number): Promise<void>
  saveToTemporaryFileAsync(quality: number): Promise<string>
  toImage(): Image
  toImageAsync(): Promise<Image>
  getFileData(): ArrayBuffer
  getFileDataAsync(): Promise<ArrayBuffer>
}
