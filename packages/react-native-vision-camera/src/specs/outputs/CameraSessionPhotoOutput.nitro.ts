import type { CameraSessionOutput } from './CameraSessionOutput.nitro'
import type { Photo } from '../Photo.nitro'

export interface CapturePhotoCallbacks {
  onWillBeginCapture?: () => void
  onWillCapturePhoto?: () => void
  onDidCapturePhoto?: () => void
  onDidFinishCapture?: () => void
}

export type FlashMode = 'off' | 'on' | 'auto'

export type QualityPrioritization = 'speed' | 'balanced' | 'quality'

export interface CapturePhotoSettings {
  flashMode?: FlashMode
  qualityPrioritization?: QualityPrioritization
  enableDepthData?: boolean
  enableShutterSound?: boolean
  isAutoRedEyeReductionEnabled?: boolean
  isCameraCalibrationDataDeliveryEnabled?: boolean
  isAutoContentAwareDistortionCorrectionEnabled?: boolean
  isAutoVirtualDeviceFusionEnabled?: boolean
  // TODO: Add previewPhotoFormat
}

export interface CameraSessionPhotoOutput extends CameraSessionOutput {
  capturePhoto(
    settings?: CapturePhotoSettings,
    callbacks?: CapturePhotoCallbacks
  ): Promise<Photo>
}
