import { useEffect, useState } from 'react';
import { CameraRuntimeError } from 'src/CameraError';
import { sortDevices } from 'src/utils/FormatFilter';
import { Camera } from '../Camera';
import { CameraDevice, LogicalCameraDeviceType, parsePhysicalDeviceTypes, PhysicalCameraDeviceType } from '../CameraDevice';

/**
 * Gets the best available `CameraDevice`. Devices with more cameras are preferred.
 *
 * @returns The best matching `CameraDevice`.
 * @throws `CameraRuntimeError` if no device was found.
 * @example
 * const device = useCameraDevice()
 * // ...
 * return <Camera device={device} />
 */
export function useCameraDevice(): CameraDevice;

/**
 * Gets a `CameraDevice` for the requested device type.
 *
 * @returns A `CameraDevice` for the requested device type.
 * @throws `CameraRuntimeError` if no device was found.
 * @example
 * const device = useCameraDevice('wide-angle-camera')
 * // ...
 * return <Camera device={device} />
 */
export function useCameraDevice(deviceType: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevice | undefined;

export function useCameraDevice(deviceType?: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevice | undefined {
  const [device, setDevice] = useState<CameraDevice>();

  useEffect(() => {
    let isMounted = true;

    const loadDevice = async (): Promise<void> => {
      const devices = await Camera.getAvailableCameraDevices();
      if (!isMounted) return;

      let bestMatch: CameraDevice | undefined;
      if (deviceType == null) {
        // use any device
        const sorted = devices.sort(sortDevices);
        bestMatch = sorted[0];
      } else {
        // use specified device (type)
        bestMatch = devices.find((d) => {
          const parsedType = parsePhysicalDeviceTypes(d.devices);
          return parsedType === deviceType;
        });
      }
      if (bestMatch == null) throw new CameraRuntimeError('device/no-device', 'No Camera device was found!');
      setDevice(bestMatch);
    };
    loadDevice();

    return () => {
      isMounted = false;
    };
  }, [deviceType]);

  return device;
}
