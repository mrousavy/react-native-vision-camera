import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './inputs/CameraDeviceFactory.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraSessionPhotoOutput } from './outputs/CameraSessionPhotoOutput.nitro'
import type { CameraSessionFrameOutput } from './outputs/CameraSessionFrameOutput.nitro'

export interface CameraFactory extends HybridObject<{ ios: 'swift' }> {
  createDeviceFactory(): Promise<CameraDeviceFactory>
  createCameraSession(): CameraSession
  createPhotoOutput(): CameraSessionPhotoOutput
  createFrameOutput(): CameraSessionFrameOutput
}
