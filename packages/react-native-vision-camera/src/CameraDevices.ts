import { HybridCameraFactory } from '.'
import type { CameraDevice } from './specs/CameraDevice.nitro'
import type { ListenerSubscription } from './specs/ListenerSubscription'

// this caches our Camera Devices
let cameraDevices: CameraDevice[] = []
const listeners: ((newDevices: CameraDevice[]) => void)[] = []

// this is async so this might run in parallel
HybridCameraFactory.createDeviceFactory().then((factory) => {
  // CameraDeviceFactory is loaded - get initial devices
  cameraDevices = factory.cameraDevices

  // Add listener when devices change
  factory.addOnCameraDevicesChangedListener((newDevices) => {
    cameraDevices = newDevices
    listeners.forEach((listener) => listener(newDevices))
  })
})

export function getAllCameraDevices(): CameraDevice[] {
  return cameraDevices
}

export function addOnCameraDevicesChangedListener(
  listener: (newDevices: CameraDevice[]) => void
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
