import type { HybridObject } from 'react-native-nitro-modules'

export type CameraOutputType = 'photo' | 'video' | 'stream' | 'preview'

export interface CameraOutput extends HybridObject<{ ios: 'swift' }> {
  readonly type: CameraOutputType
}
