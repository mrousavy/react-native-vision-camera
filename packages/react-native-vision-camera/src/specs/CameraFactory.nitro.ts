import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDeviceFactory } from './CameraDeviceFactory.nitro'

export interface CameraFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createDeviceFactory(): Promise<CameraDeviceFactory>
}
