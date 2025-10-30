import type { Image } from 'react-native-nitro-image'
import type { HybridObject } from 'react-native-nitro-modules'

export interface Photo extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number

  readonly isRawPhoto: boolean

  readonly hasPixelBuffer: boolean
  getPixelBuffer(): ArrayBuffer

  readonly hasPreviewPixelBuffer: boolean
  getPreviewPixelBuffer(): ArrayBuffer
  toPreviewImage(): Image
  toPreviewImageAsync(): Promise<Image>

  saveToFileAsync(path: string, quality: number): Promise<void>
  saveToTemporaryFileAsync(quality: number): Promise<string>
  toImage(): Image
  toImageAsync(): Promise<Image>
  getFileData(): ArrayBuffer
  getFileDataAsync(): Promise<ArrayBuffer>
}
