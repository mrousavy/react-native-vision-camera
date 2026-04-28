import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraFactory } from '../CameraFactory.nitro'
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
   * Get a list of all {@linkcode CameraDevice}s on this platform.
   *
   * This list may change as {@linkcode CameraDevice}s get plugged in/out (e.g.
   * {@linkcode CameraPosition | 'external'} Cameras via USB/UVC), devices
   * become available/unavailable (e.g. continuity Cameras), or Camera positions
   * change (e.g. on foldable phones).
   */
  readonly cameraDevices: CameraDevice[]
  /**
   * Get or set the user's default preferred camera device.
   * Setting a device here will persist the preference between apps.
   */
  userPreferredCamera?: CameraDevice

  /**
   * A list of all {@linkcode CameraDevice} combinations that are supported
   * in Multi-Cam {@linkcode CameraSession}s.
   *
   * This list always contains a subset of {@linkcode cameraDevices}, often
   * less.
   *
   * @discussion
   * For example, on many platforms only a {@linkcode CameraPosition | 'front'}
   * and a {@linkcode CameraPosition | 'back'} {@linkcode CameraDevice} are
   * supported to be used in a Multi-Cam {@linkcode CameraSession} - in this case,
   * the returned 2D Array looks something like this:
   * ```
   * [
   *   [{ position: 'back', ... }, { position: 'front', ... }]
   * ]
   * ```
   * Two {@linkcode CameraPosition | 'back'}-, or two {@linkcode CameraPosition | 'front'}
   * {@linkcode CameraDevice}s are often not supported together in a Multi-Cam
   * {@linkcode CameraSession}.
   *
   * When creating a Multi-Cam {@linkcode CameraSession}, you must ensure
   * that you are using Device combinations that are actually supported
   * on the platform, otherwise the session might fail to configure.
   *
   * @discussion
   * If the platform does not support Multi-Cam {@linkcode CameraSession}s,
   * an empty array (`[]`) will be returned.
   *
   *
   * @example
   * ```ts
   * if (VisionCamera.supportsMultiCamSessions) {
   *   const deviceFactory = await VisionCamera.createDeviceFactory()
   *   const deviceCombinations = deviceFactory.supportedMultiCamDeviceCombinations[0]
   *   if (deviceCombinations != null) {
   *     const connections = deviceCombinations.map((device) => {
   *       const previewOutput = VisionCamera.createPreviewOutput()
   *       return {
   *         input: device,
   *         outputs: [
   *           { output: previewOutput, mirrorMode: 'auto' }
   *         ],
   *         constraints: []
   *       } satisfies CameraSessionConnection
   *     })
   *
   *     const session = await VisionCamera.createCameraSession(true)
   *     const controllers = await session.configure(connections)
   *     await session.start()
   *   }
   * }
   * ```
   *
   * @see {@linkcode CameraFactory.supportsMultiCamSessions}
   */
  readonly supportedMultiCamDeviceCombinations: CameraDevice[][]

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
