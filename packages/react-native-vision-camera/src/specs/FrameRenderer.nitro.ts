import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame } from './instances/Frame.nitro'

export interface FrameRenderer extends HybridObject<{ ios: 'swift' }> {
  renderFrame(frame: Frame): void
}
