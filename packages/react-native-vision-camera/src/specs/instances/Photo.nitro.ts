import type { Image } from 'react-native-nitro-image'
import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
import type { Depth } from './Depth.nitro'

export interface Photo extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number
  readonly isRawPhoto: boolean
  readonly metadata: AnyMap

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
