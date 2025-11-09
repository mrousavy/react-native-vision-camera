import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './inputs/CameraDeviceFactory.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraPhotoOutput } from './outputs/CameraPhotoOutput.nitro'
import type { CameraFrameOutput } from './outputs/CameraFrameOutput.nitro'
import type { TargetPixelFormat } from './common-types/TargetPixelFormat'
import type { CameraPreviewOutput } from './outputs/CameraPreviewOutput.nitro'

export interface CameraFactory extends HybridObject<{ ios: 'swift' }> {
  readonly supportsMultiCamSessions: boolean

  createDeviceFactory(): Promise<CameraDeviceFactory>
  createCameraSession(enableMultiCam: boolean): CameraSession
  createPhotoOutput(): CameraPhotoOutput
  createFrameOutput(pixelFormat: TargetPixelFormat): CameraFrameOutput
  createPreviewOutput(): CameraPreviewOutput
}
