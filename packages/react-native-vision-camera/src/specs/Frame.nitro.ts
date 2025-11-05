import type { HybridObject } from 'react-native-nitro-modules'
import type { PixelFormat } from './common-types/PixelFormat'
import type { Image } from 'react-native-nitro-image'
import type { Orientation } from './common-types/Orientation'

export interface Frame extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number
  readonly isValid: boolean
  readonly width: number
  readonly height: number
  readonly pixelFormat: PixelFormat
  readonly orientation: Orientation

  getPixelBuffer(): ArrayBuffer

  toImage(): Image
  toImageAsync(): Promise<Image>
}
