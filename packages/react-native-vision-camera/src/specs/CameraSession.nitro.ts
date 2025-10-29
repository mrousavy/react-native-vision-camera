import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraSessionOutput } from './outputs/CameraSessionOutput.nitro'

export interface CameraSession
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly isRunning: boolean
  configureOutputs(outputs: CameraSessionOutput): Promise<void>
}
