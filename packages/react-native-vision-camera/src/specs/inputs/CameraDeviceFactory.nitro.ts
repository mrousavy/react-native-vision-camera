import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDevice } from './CameraDevice.nitro'
import type { ListenerSubscription } from '../common-types/ListenerSubscription'
import type { CameraPosition } from '../common-types/CameraPosition'
import type { MediaType } from '../CameraFormat.nitro'
import type { DeviceType } from '../common-types/DeviceType'

export interface CameraDeviceFactory extends HybridObject<{ ios: 'swift' }> {
  /**
   * Get a list of all devices.
   * This list may change as camera devices get plugged in/out.
   */
  readonly cameraDevices: CameraDevice[]
  /**
   * Get or set the user's default preferred camera device.
   * Setting a device here will persist the preference between apps.
   */
  userPreferredCamera?: CameraDevice

  addOnCameraDevicesChangedListener(
    listener: (newDevices: CameraDevice[]) => void
  ): ListenerSubscription

  getDefaultCamera(
    deviceType: DeviceType,
    position: CameraPosition,
    mediaType?: MediaType
  ): CameraDevice | undefined
}
