import { useMemo } from 'react';
import { CameraDevice, CameraPosition } from '../CameraDevice';
import { getCameraDevice, DeviceFilter } from '../devices/getCameraDevice';
import { useCameraDevices } from './useCameraDevices';

/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting filter.
 * @param position The position of the Camera device relative to the phone.
 * @param filter The filter you want to use. The Camera device that matches your filter the closest will be returned
 * @returns The Camera device that matches your filter the closest.
 * @example
 * ```ts
 * const [position, setPosition] = useState<CameraPosition>('back')
 * const device = useCameraDevice(position, {
 *    physicalDevices: ['wide-angle-camera']
 * })
 * ```
 */
export function useCameraDevice(position: CameraPosition, filter?: DeviceFilter): CameraDevice | undefined {
  const devices = useCameraDevices();

  const device = useMemo(
    () => getCameraDevice(devices, position, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, position, JSON.stringify(filter)],
  );

  return device;
}
