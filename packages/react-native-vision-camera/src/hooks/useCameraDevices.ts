import { useSyncExternalStore } from 'react'
import {
  addOnCameraDevicesChangedListener,
  getAllCameraDevices,
} from '../CameraDevices'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'

function subscribe(onStoreChange: () => void): () => void {
  const listener = addOnCameraDevicesChangedListener(() => onStoreChange())
  return () => listener.remove()
}

function getSnapshot(): CameraDevice[] {
  return getAllCameraDevices()
}

/**
 * Use a list of all {@linkcode CameraDevice}s on this phone.
 *
 * The hook automatically updates with the new devices as
 * devices get added or removed to the phone - e.g. USB Cameras.
 *
 * @see {@linkcode useCameraDevice}
 * @see {@linkcode getCameraDevice}
 * @example
 * ```ts
 * const devices = useCameraDevices()
 * const backDevice = devices.find((d) => d.position === 'back')
 * ```
 */
export function useCameraDevices(): CameraDevice[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
