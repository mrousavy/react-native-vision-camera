import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDevice } from './inputs/CameraDevice.nitro'

export interface CameraDeviceController extends HybridObject<{ ios: 'swift' }> {
  readonly device: CameraDevice

  // TODO: Add all props that can be configured here
  configure(zoom: number): Promise<void>
}
