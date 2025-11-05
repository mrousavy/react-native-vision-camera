import type { HybridObject } from 'react-native-nitro-modules'

export interface Frame extends HybridObject<{ ios: 'swift' }> {
  readonly timestamp: number

  getPixelBuffer(): ArrayBuffer
}
