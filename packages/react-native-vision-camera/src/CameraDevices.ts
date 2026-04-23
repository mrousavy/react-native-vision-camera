import type { CameraPosition } from './specs/common-types/CameraPosition'
import type { ListenerSubscription } from './specs/common-types/ListenerSubscription'
import type { CameraDevice } from './specs/inputs/CameraDevice.nitro'
import type { CameraExtension } from './specs/inputs/CameraExtension.nitro'
import { VisionCamera } from './VisionCamera'

// this caches our Camera Devices
let cameraDevices: CameraDevice[] = []
const listeners: ((newDevices: CameraDevice[]) => void)[] = []
function setCameraDevices(devices: CameraDevice[]): void {
  cameraDevices = devices
  for (const listener of listeners) {
    listener(devices)
  }
}

// Prepares the factory once this file is imported.
const factoryPromise = VisionCamera.createDeviceFactory()

// once the factory is created, start loading devices already in background
factoryPromise
  .then((factory) => {
    // CameraDeviceFactory is loaded - get initial devices
    setCameraDevices(factory.cameraDevices)

    // Add listener when devices change
    factory.addOnCameraDevicesChangedListener((newDevices) => {
      setCameraDevices(newDevices)
    })
  })

  .catch((e) => {
    console.error(`Failed to load Camera Devices!`, e)
  })

/**
 * Returns all {@linkcode CameraDevice}s currently available on this phone.
 *
 * This is a synchronous snapshot - it only contains devices that have already been
 * discovered. If you want to reactively listen to device changes (e.g. when a
 * USB Camera is plugged in or out), use {@linkcode addOnCameraDevicesChangedListener}
 * or the {@linkcode useCameraDevices} hook instead.
 *
 * @see {@linkcode useCameraDevices}
 * @see {@linkcode getCameraDevice}
 */
export function getAllCameraDevices(): CameraDevice[] {
  return cameraDevices
}

/**
 * Returns the default {@linkcode CameraDevice} for the given {@linkcode CameraPosition}.
 *
 * This is usually the physical wide-angle Camera on the respective side of the device.
 * If no Camera is available on the given position, this returns `undefined`.
 *
 * @see {@linkcode getCameraDevice}
 */
export async function getDefaultCameraDevice(
  position: CameraPosition,
): Promise<CameraDevice | undefined> {
  const factory = await factoryPromise
  return factory.getDefaultCamera(position)
}

/**
 * Adds a listener that gets called whenever the list of available
 * {@linkcode CameraDevice}s changes - for example when a USB Camera is plugged in or out.
 *
 * The returned {@linkcode ListenerSubscription} must be removed via
 * {@linkcode ListenerSubscription.remove | remove()} when no longer needed.
 *
 * @see {@linkcode useCameraDevices}
 */
export function addOnCameraDevicesChangedListener(
  listener: (newDevices: CameraDevice[]) => void,
): ListenerSubscription {
  // Add listener
  listeners.push(listener)
  return {
    remove() {
      // Find index of the listener we added (via reference ID)
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        // Remove the listener at the index
        listeners.splice(index, 1)
      }
    },
  }
}

/**
 * Returns all {@linkcode CameraExtension}s supported by the given {@linkcode CameraDevice}.
 *
 * Extensions are vendor-specific Camera modes (such as HDR, Night, or Bokeh)
 * implemented in the device's ISP pipeline.
 *
 * @platform Android
 * @see {@linkcode useCameraDeviceExtensions}
 * @see {@linkcode CameraExtension}
 */
export async function getSupportedExtensions(
  device: CameraDevice,
): Promise<CameraExtension[]> {
  const factory = await factoryPromise
  return factory.getSupportedExtensions(device)
}
