import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraPosition } from '../common-types/CameraPosition'
import type { ListenerSubscription } from '../common-types/ListenerSubscription'
import type { CameraSession } from '../session/CameraSession.nitro'
import type { CameraDevice } from './CameraDevice.nitro'
import type { CameraExtension } from './CameraExtension.nitro'

/**
 * The {@linkcode CameraDeviceFactory} allows getting {@linkcode CameraDevice}s,
 * listening to device changes, and querying extensions or preferred Cameras.
 */
export interface CameraDeviceFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
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

  /**
   * Add a listener to be called whenever the
   * available {@linkcode cameraDevices} change,
   * for example when an external USB Camera
   * gets plugged in- or out- of the Device.
   */
  addOnCameraDevicesChangedListener(
    listener: (newDevices: CameraDevice[]) => void,
  ): ListenerSubscription

  /**
   * Get the {@linkcode CameraDevice} with the given unique
   * {@linkcode id}.
   *
   * If no device with the given {@linkcode id} is found,
   * this method returns `undefined`.
   */
  getCameraForId(id: string): CameraDevice | undefined

  /**
   * Gets a list of all vendor-specific {@linkcode CameraExtension}s
   * the given {@linkcode CameraDevice} supports.
   *
   * A {@linkcode CameraExtension} can be enabled when creating
   * a {@linkcode CameraSession} via {@linkcode CameraSession.configure | configure(...)}.
   */
  getSupportedExtensions(camera: CameraDevice): Promise<CameraExtension[]>

  /**
   * Get the platform's default {@linkcode CameraDevice}
   * at the given {@linkcode CameraPosition}.
   */
  getDefaultCamera(position: CameraPosition): CameraDevice | undefined
}
