import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import type { DeviceFilter } from '../devices/getCameraDevice'
import { getCameraDevice } from '../devices/getCameraDevice'
import type { TargetCameraPosition } from '../specs/common-types/CameraPosition'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import { useCameraDeviceFactory } from './internal/useCameraDeviceFactory'

/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting {@linkcode filter},
 * or a default Camera device at the given {@linkcode position} if no {@linkcode filter} was passed.
 *
 * This hook is reactive to device changes. If a new device is plugged in, this hook updates.
 *
 * @param position The position of the Camera device relative to the phone.
 * @param filter The filter you want to use. The Camera device that matches your filter the closest will be returned
 * @returns The Camera device that matches your filter the closest, or `undefined` if no such Camera Device exists on the given {@linkcode position}.
 * @example
 * ```ts
 * const device = useCameraDevice('back', {
 *    physicalDevices: ['wide-angle']
 * })
 * ```
 */
export function useCameraDevice(
  position: TargetCameraPosition,
  filter?: DeviceFilter,
): CameraDevice | undefined {
  const deviceFactory = useCameraDeviceFactory()

  // biome-ignore lint/correctness/useExhaustiveDependencies: It's an inline object.
  const memoizedFilter = useMemo(() => filter, [JSON.stringify(filter)])

  const cachedDevice = useRef<CameraDevice | undefined>(undefined)
  if (deviceFactory != null && cachedDevice.current == null) {
    // Initialize `cachedDevice`
    cachedDevice.current = deviceFactory.getDefaultCamera(position)
  }
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (deviceFactory == null) {
        // CameraDeviceFactory still loading
        return () => {}
      }
      const listener = deviceFactory.addOnCameraDevicesChangedListener(() => {
        // `getCameraDevice(..)` returns a new Device every time - either a default one or via filter
        const device = getCameraDevice(deviceFactory, position, memoizedFilter)
        if (device?.id !== cachedDevice.current?.id) {
          // Device actually changed - notify & re-render
          cachedDevice.current = device
          onStoreChange()
        }
      })
      return () => listener.remove()
    },
    [deviceFactory, position, memoizedFilter],
  )
  const getSnapshot = useCallback(() => cachedDevice.current, [])

  return useSyncExternalStore(subscribe, getSnapshot)
}
