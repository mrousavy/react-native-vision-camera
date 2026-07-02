import { useCallback, useRef, useSyncExternalStore } from 'react'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import { useCameraDeviceFactory } from './internal/useCameraDeviceFactory'
import { useCameraDevice } from './useCameraDevice'

/**
 * Get a list of all {@linkcode CameraDevice}s.
 *
 * @note It is recommended to use {@linkcode useCameraDevice | useCameraDevice(...)} if
 * you only need a single {@linkcode CameraDevice}, as a full list of available devices
 * can be heavy.
 */
export function useCameraDevices(): CameraDevice[] {
  const deviceFactory = useCameraDeviceFactory()

  const cachedDevices = useRef<CameraDevice[]>([])
  if (deviceFactory != null && cachedDevices.current.length === 0) {
    // Initialize `cachedDevices`
    cachedDevices.current = deviceFactory.cameraDevices
  }
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (deviceFactory == null) {
        // CameraDeviceFactory still loading
        return () => {}
      }
      const listener = deviceFactory.addOnCameraDevicesChangedListener(
        (newDevices) => {
          cachedDevices.current = newDevices
          onStoreChange()
        },
      )
      return () => listener.remove()
    },
    [deviceFactory],
  )
  const getSnapshot = useCallback(() => cachedDevices.current, [])

  return useSyncExternalStore(subscribe, getSnapshot)
}
