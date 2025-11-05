import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraSessionOutput } from './outputs/CameraSessionOutput.nitro'
import type { CameraDevice } from './CameraDevice.nitro'
import type { CameraFormat } from './CameraFormat.nitro'
import type { Range } from './common-types/Range'
import type { FocusMode } from './common-types/FocusMode'
import type { ExposureMode } from './common-types/ExposureMode'
import type { WhiteBalanceMode } from './common-types/WhiteBalanceMode'

export type FrameRateConfiguration = 'auto-fps' | 'default-fps'

export interface CameraSessionConfiguration {
  activeFormat?: CameraFormat
  activeDepthFormat?: CameraFormat
  fps?: Range | number
  enableAutoFps?: boolean
  focusMode?: FocusMode
  exposureMode?: ExposureMode
  whiteBalanceMode?: WhiteBalanceMode
  zoom?: number
}

export interface CameraSession extends HybridObject<{ ios: 'swift' }> {
  readonly isRunning: boolean
  configure(
    inputs: CameraDevice[],
    outputs: CameraSessionOutput[],
    configuration: CameraSessionConfiguration
  ): Promise<void>

  start(): Promise<void>
  stop(): Promise<void>
}
