import type { HybridObject } from 'react-native-nitro-modules'

export type CameraSessionOutputType = 'photo' | 'video' | 'stream' | 'preview'

export interface CameraSessionOutput
  extends HybridObject<{ ios: 'swift' }> {
  readonly type: CameraSessionOutputType
}
