import { useMemo } from 'react'
import type { CameraDevice, CameraPosition } from '../types/CameraDevice'
import type { DeviceFilter } from '../devices/getCameraDevice'
import { getCameraDevice } from '../devices/getCameraDevice'
import { useCameraDevices } from './useCameraDevices'

/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting filter.
 * @param position The position of the Camera device relative to the phone.
 * @param filter The filter you want to use. The Camera device that matches your filter the closest will be returned
 * @returns The Camera device that matches your filter the closest, or `undefined` if no such Camera Device exists on the given {@linkcode position}.
 * @example
 * ```ts
 * const device = useCameraDevice('back', {
 *    physicalDevices: ['wide-angle-camera']
 * })
 * ```
 */
export function useCameraDevice(position: CameraPosition, filter?: DeviceFilter): CameraDevice | undefined {
  const devices = useCameraDevices()

  const device = useMemo(
    () => getCameraDevice(devices, position, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, position, JSON.stringify(filter)],
  )

  return device
}
