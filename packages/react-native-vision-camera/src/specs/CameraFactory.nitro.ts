import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './inputs/CameraDeviceFactory.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraPhotoOutput } from './outputs/CameraPhotoOutput.nitro'
import type { CameraFrameOutput } from './outputs/CameraFrameOutput.nitro'
import type { CameraPreviewOutput } from './outputs/CameraPreviewOutput.nitro'
import type { TargetVideoPixelFormat } from './common-types/VideoPixelFormat'
import type { TargetDepthPixelFormat } from './common-types/DepthPixelFormat'
import type { CameraDepthFrameOutput } from './outputs/CameraDepthFrameOutput.nitro'
import type { FrameRenderer } from './FrameRenderer.nitro'

export interface CameraFactory extends HybridObject<{ ios: 'swift' }> {
  readonly supportsMultiCamSessions: boolean

  // Session
  createCameraSession(enableMultiCam: boolean): Promise<CameraSession>
  // Inputs
  createDeviceFactory(): Promise<CameraDeviceFactory>
  // Outputs
  createPhotoOutput(): CameraPhotoOutput
  createFrameOutput(pixelFormat: TargetVideoPixelFormat): CameraFrameOutput
  createDepthFrameOutput(
    pixelFormat: TargetDepthPixelFormat
  ): CameraDepthFrameOutput
  createPreviewOutput(): CameraPreviewOutput

  // Utils
  createFrameRenderer(): FrameRenderer
}
