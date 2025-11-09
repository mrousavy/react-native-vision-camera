import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './inputs/CameraDeviceFactory.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraSessionPhotoOutput } from './outputs/CameraSessionPhotoOutput.nitro'
import type { CameraSessionFrameOutput } from './outputs/CameraSessionFrameOutput.nitro'
import type { TargetPixelFormat } from './common-types/TargetPixelFormat'
import type { CameraSessionPreviewOutput } from './outputs/CameraSessionPreviewOutput.nitro'

export interface CameraFactory extends HybridObject<{ ios: 'swift' }> {
  readonly supportsMultiCamSessions: boolean

  createDeviceFactory(): Promise<CameraDeviceFactory>
  createCameraSession(enableMultiCam: boolean): CameraSession
  createPhotoOutput(): CameraSessionPhotoOutput
  createFrameOutput(pixelFormat: TargetPixelFormat): CameraSessionFrameOutput
  createPreviewOutput(): CameraSessionPreviewOutput
}
