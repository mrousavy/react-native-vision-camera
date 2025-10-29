import type { Image } from 'react-native-nitro-image'

export interface Photo extends Image {
  readonly timestamp: number
}
