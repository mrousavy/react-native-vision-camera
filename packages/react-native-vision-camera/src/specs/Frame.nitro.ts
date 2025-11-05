import type { HybridObject } from 'react-native-nitro-modules'
import type { PixelFormat } from './common-types/PixelFormat'

export interface Frame extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number
  readonly isValid: boolean
  readonly width: number
  readonly height: number
  readonly pixelFormat: PixelFormat

  getPixelBuffer(): ArrayBuffer
}
