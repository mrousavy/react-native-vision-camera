import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOutput } from './outputs/CameraOutput.nitro'
import type { CameraDevice } from './inputs/CameraDevice.nitro'
import type { CameraFormat } from './CameraFormat.nitro'
import type { Range } from './common-types/Range'
import type { FocusMode } from './common-types/FocusMode'
import type { ExposureMode } from './common-types/ExposureMode'
import type { WhiteBalanceMode } from './common-types/WhiteBalanceMode'
import type { NativeThread } from './frame-processors/NativeThread.nitro'
import type { CameraDeviceController } from './CameraDeviceController.nitro'

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

export interface CameraSessionConnection {
  input: CameraDevice
  outputs: CameraOutput[]
}

export interface CameraSession extends HybridObject<{ ios: 'swift' }> {
  readonly isRunning: boolean
  readonly cameraThread: NativeThread
  readonly supportsMultiCam: boolean
  configure(
    connections: CameraSessionConnection[]
  ): Promise<CameraDeviceController[]>

  start(): Promise<void>
  stop(): Promise<void>
}
