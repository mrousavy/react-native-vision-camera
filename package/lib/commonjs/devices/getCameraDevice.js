"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCameraDevice = getCameraDevice;
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
function getCameraDevice(devices, position, filter = {}) {
  const filtered = devices.filter(d => d.position === position);
  let bestDevice = filtered[0];
  if (bestDevice == null) return undefined;

  // Compare each device using a point scoring system
  for (const device of filtered) {
    let leftPoints = 0;
    let rightPoints = 0;

    // prefer higher hardware-level
    if (bestDevice.hardwareLevel === 'full') leftPoints += 4;
    if (device.hardwareLevel === 'full') rightPoints += 4;
    if (filter.physicalDevices != null) {
      // user did pass a physical device filter, two possible scenarios:
      // 1. user wants all cameras ([ultra-wide, wide, tele]) to zoom. prefer those devices that have all 3 cameras.
      // 2. user wants only one ([wide]) for faster performance. prefer those devices that only have one camera, if they have more, we rank them lower.
      for (const d of bestDevice.physicalDevices) {
        if (filter.physicalDevices.includes(d)) leftPoints += 1;else leftPoints -= 1;
      }
      for (const d of device.physicalDevices) {
        if (filter.physicalDevices.includes(d)) rightPoints += 1;else rightPoints -= 1;
      }
    } else {
      // user did not pass a physical device filter. prefer wide-angle-camera as a default
      if (bestDevice.physicalDevices.includes('wide-angle-camera')) leftPoints += 2;
      if (device.physicalDevices.includes('wide-angle-camera')) rightPoints += 2;
      // if we have more than one device, we rank it lower. we only want a simple camera
      if (bestDevice.physicalDevices.length > device.physicalDevices.length) leftPoints -= 1;
      if (device.physicalDevices.length > bestDevice.physicalDevices.length) rightPoints -= 1;
    }
    if (rightPoints > leftPoints) bestDevice = device;
  }
  return bestDevice;
}
//# sourceMappingURL=getCameraDevice.js.map