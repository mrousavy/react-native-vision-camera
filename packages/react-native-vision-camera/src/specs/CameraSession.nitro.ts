import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraSessionOutput } from './outputs/CameraSessionOutput.nitro'
import type { CameraDevice } from './CameraDevice.nitro'

export interface CameraSession
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly isRunning: boolean
  configure(
    inputs: CameraDevice[],
    outputs: CameraSessionOutput[]
  ): Promise<void>
}
