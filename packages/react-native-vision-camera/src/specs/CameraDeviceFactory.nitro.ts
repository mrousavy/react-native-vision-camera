import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDevice } from './CameraDevice.nitro'
import type { ListenerSubscription } from './common-types/ListenerSubscription'

export interface CameraDeviceFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly cameraDevices: CameraDevice[]
  addOnCameraDevicesChangedListener(
    listener: (newDevices: CameraDevice[]) => void
  ): ListenerSubscription
}
