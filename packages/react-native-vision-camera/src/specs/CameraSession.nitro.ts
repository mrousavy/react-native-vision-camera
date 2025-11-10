import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOutput } from './outputs/CameraOutput.nitro'
import type { CameraDevice } from './inputs/CameraDevice.nitro'
import type { NativeThread } from './frame-processors/NativeThread.nitro'
import type { CameraDeviceController } from './CameraDeviceController.nitro'

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
