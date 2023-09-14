import { Camera } from '../Camera';
import { CameraDevice, CameraPosition, PhysicalCameraDeviceType } from '../CameraDevice';
import { CameraRuntimeError } from '../CameraError';

export interface DeviceFilter {
  /**
   * The desired physical devices your camera device should have.
   * For example, if you only want a simple `wide-angle-camera` device, devices with more physical devices will be ignored.
   *
   * **Note:** Devices with less phyiscal devices (`['wide-angle-camera']`) are usually faster to start-up than more complex
   * devices (`['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera']`), but don't offer zoom switch-over capabilities.
   */
  devices?: PhysicalCameraDeviceType[];
}

/**
 * Get the best matching Camera device that satisfies your requirements using a sorting filter.
 * @param filter The filter you want to use. The device that matches your filter the closest will be returned.
 * @returns The device that matches your filter the closest.
 */
export async function getCameraDevice(position: CameraPosition, filter: DeviceFilter): Promise<CameraDevice> {
  const devices = await Camera.getAvailableCameraDevices();

  const filtered = devices.filter((d) => d.position === position);
  const sortedDevices = filtered.sort((left, right) => {
    let leftPoints = 0;
    let rightPoints = 0;

    if (left.hardwareLevel === 'full') leftPoints += 2;
    if (right.hardwareLevel === 'full') rightPoints += 2;

    if (filter.devices != null) {
      for (const device of left.devices) {
        if (filter.devices.includes(device)) leftPoints += 1;
        else leftPoints -= 1;
      }
      for (const device of right.devices) {
        if (filter.devices.includes(device)) rightPoints += 1;
        else rightPoints -= 1;
      }
    }

    return leftPoints - rightPoints;
  });

  const device = sortedDevices[0];
  if (device == null) throw new CameraRuntimeError('device/invalid-device', 'No Camera Device could be found!');
  return device;
}
