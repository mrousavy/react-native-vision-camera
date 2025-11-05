import type { HybridObject } from 'react-native-nitro-modules'

export interface Frame extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number
  readonly isValid: boolean
  readonly width: number
  readonly height: number

  getPixelBuffer(): ArrayBuffer
}
