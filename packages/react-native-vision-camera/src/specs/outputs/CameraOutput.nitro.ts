import type { HybridObject } from 'react-native-nitro-modules'
import type { MediaType } from '../CameraFormat.nitro'

export type CameraOutputType = 'photo' | 'video' | 'stream' | 'preview'

export interface CameraOutput extends HybridObject<{ ios: 'swift' }> {
  readonly outputType: CameraOutputType
  readonly mediaType: MediaType
}
