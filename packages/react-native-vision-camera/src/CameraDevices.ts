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

export function getAllCameraDevices(): CameraDevice[] {
  return cameraDevices
}

export async function getDefaultCameraDevice(
  position: CameraPosition,
): Promise<CameraDevice | undefined> {
  const factory = await factoryPromise
  return factory.getDefaultCamera(position)
}

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

export async function getSupportedExtensions(
  device: CameraDevice,
): Promise<CameraExtension[]> {
  const factory = await factoryPromise
  return factory.getSupportedExtensions(device)
}
