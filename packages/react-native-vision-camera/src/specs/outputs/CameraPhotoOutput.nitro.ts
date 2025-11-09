import type { CameraOutput } from './CameraOutput.nitro'
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
  // TODO: separate enableDepthData with embedsDepthDataInPhoto
  enableDepthData?: boolean
  enableShutterSound?: boolean
  isAutoRedEyeReductionEnabled?: boolean
  isCameraCalibrationDataDeliveryEnabled?: boolean
  isAutoContentAwareDistortionCorrectionEnabled?: boolean
  isAutoVirtualDeviceFusionEnabled?: boolean
  // TODO: Add previewPhotoFormat
}

export interface CameraPhotoOutput extends CameraOutput {
  // TODO: Add prepareSettings(...)
  capturePhoto(
    settings?: CapturePhotoSettings,
    callbacks?: CapturePhotoCallbacks
  ): Promise<Photo>
}
