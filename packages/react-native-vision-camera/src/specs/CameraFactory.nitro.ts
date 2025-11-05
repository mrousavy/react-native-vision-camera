import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './CameraDeviceFactory.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraSessionPhotoOutput } from './outputs/CameraSessionPhotoOutput.nitro'

export interface CameraFactory
  extends HybridObject<{ ios: 'swift' }> {
  createDeviceFactory(): Promise<CameraDeviceFactory>
  createCameraSession(): CameraSession
  createPhotoOutput(): CameraSessionPhotoOutput
}
