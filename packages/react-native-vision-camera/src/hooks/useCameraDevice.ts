import { useMemo } from 'react'
import type { DeviceFilter } from '../devices/getCameraDevice'
import { getCameraDevice } from '../devices/getCameraDevice'
import type { CameraPosition } from '../specs/common-types/CameraPosition'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import { useCameraDevices } from './useCameraDevices'

/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting filter.
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
  position: CameraPosition,
  filter?: DeviceFilter,
): CameraDevice | undefined {
  const devices = useCameraDevices()

  // TODO: Can we use something like useSyncExternalStore or whatever to avoid "wrong" dependencies?
  // biome-ignore lint/correctness/useExhaustiveDependencies: Filter is a complex object, that'd just re-trigger each render.
  return useMemo(
    () => getCameraDevice(devices, position, filter),
    [devices, position, JSON.stringify(filter)],
  )
}
