import type { CameraDevice, CameraPosition, PhysicalCameraDeviceType } from '../types/CameraDevice'

export interface DeviceFilter {
  /**
   * The desired physical devices your camera device should have.
   *
   * Many modern phones have multiple Camera devices on one side and can combine those physical camera devices to one logical camera device.
   * For example, the iPhone 11 has two physical camera devices, the `ultra-wide-angle-camera` ("fish-eye") and the normal `wide-angle-camera`. You can either use one of those devices individually, or use a combined logical camera device which can smoothly switch over between the two physical cameras depending on the current `zoom` level.
   * When the user is at 0.5x-1x zoom, the `ultra-wide-angle-camera` can be used to offer a fish-eye zoom-out effect, and anything above 1x will smoothly switch over to the `wide-angle-camera`.
   *
   * **Note:** Devices with less phyiscal devices (`['wide-angle-camera']`) are usually faster to start-up than more complex
   * devices (`['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera']`), but don't offer zoom switch-over capabilities.
   *
   * @example
   * ```ts
   * // This device is simpler, so it starts up faster.
   * getCameraDevice({ physicalDevices: ['wide-angle-camera'] })
   * // This device is more complex, so it starts up slower, but you can switch between devices on 0.5x, 1x and 2x zoom.
   * getCameraDevice({ physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'] })
   * ```
   */
  physicalDevices?: PhysicalCameraDeviceType[]
}

/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting filter, or `undefined` if {@linkcode devices} does not contain any devices.
 * @param position The position of the Camera device relative to the phone.
 * @param filter The filter you want to use. The Camera device that matches your filter the closest will be returned
 * @returns The Camera device that matches your filter the closest, or `undefined` if no such Camera Device exists on the given {@linkcode position}.
 * @example
 * ```ts
 * const devices = Camera.getAvailableCameraDevices()
 * const device = getCameraDevice(devices, 'back', {
 *    physicalDevices: ['wide-angle-camera']
 * })
 * ```
 */
export function getCameraDevice(devices: CameraDevice[], position: CameraPosition, filter: DeviceFilter = {}): CameraDevice | undefined {
  const filtered = devices.filter((d) => d.position === position)

  let bestDevice = filtered[0]
  if (bestDevice == null) return undefined

  // Compare each device using a point scoring system
  for (const device of filtered) {
    let leftPoints = 0
    let rightPoints = 0

    // prefer higher hardware-level
    if (bestDevice.hardwareLevel === 'full') leftPoints += 4
    if (device.hardwareLevel === 'full') rightPoints += 4

    if (filter.physicalDevices != null) {
      // user did pass a physical device filter, two possible scenarios:
      // 1. user wants all cameras ([ultra-wide, wide, tele]) to zoom. prefer those devices that have all 3 cameras.
      // 2. user wants only one ([wide]) for faster performance. prefer those devices that only have one camera, if they have more, we rank them lower.
      for (const d of bestDevice.physicalDevices) {
        if (filter.physicalDevices.includes(d)) leftPoints += 1
        else leftPoints -= 1
      }
      for (const d of device.physicalDevices) {
        if (filter.physicalDevices.includes(d)) rightPoints += 1
        else rightPoints -= 1
      }
    } else {
      // user did not pass a physical device filter. prefer wide-angle-camera as a default
      if (bestDevice.physicalDevices.includes('wide-angle-camera')) leftPoints += 2
      if (device.physicalDevices.includes('wide-angle-camera')) rightPoints += 2
      // if we have more than one device, we rank it lower. we only want a simple camera
      if (bestDevice.physicalDevices.length > device.physicalDevices.length) leftPoints -= 1
      if (device.physicalDevices.length > bestDevice.physicalDevices.length) rightPoints -= 1
    }

    if (rightPoints > leftPoints) bestDevice = device
  }

  return bestDevice
}
