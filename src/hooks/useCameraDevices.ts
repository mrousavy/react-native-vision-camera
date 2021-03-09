import { useEffect, useState } from 'react';
import type { CameraPosition } from '../CameraPosition';
import { sortDevices } from '../utils/FormatFilter';
import { Camera } from '../Camera';
import { CameraDevice, LogicalCameraDeviceType, parsePhysicalDeviceTypes, PhysicalCameraDeviceType } from '../CameraDevice';

type CameraDevices = {
  [key in CameraPosition]: CameraDevice | undefined;
};
const DefaultCameraDevices: CameraDevices = {
  back: undefined,
  external: undefined,
  front: undefined,
  unspecified: undefined,
};

/**
 * Gets the best available {@linkcode CameraDevice}. Devices with more cameras are preferred.
 *
 * @returns The best matching {@linkcode CameraDevice}.
 * @throws {@linkcode CameraRuntimeError} if no device was found.
 * @example
 * ```tsx
 * const device = useCameraDevice()
 * // ...
 * return <Camera device={device} />
 * ```
 */
export function useCameraDevices(): CameraDevices;

/**
 * Gets a {@linkcode CameraDevice} for the requested device type.
 *
 * @param {PhysicalCameraDeviceType | LogicalCameraDeviceType} deviceType Specifies a device type which will be used as a device filter.
 * @returns A {@linkcode CameraDevice} for the requested device type.
 * @throws {@linkcode CameraRuntimeError} if no device was found.
 * @example
 * ```tsx
 * const device = useCameraDevice('wide-angle-camera')
 * // ...
 * return <Camera device={device} />
 * ```
 */
export function useCameraDevices(deviceType: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevices;

export function useCameraDevices(deviceType?: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevices {
  const [cameraDevices, setCameraDevices] = useState<CameraDevices>(DefaultCameraDevices);

  useEffect(() => {
    let isMounted = true;

    const loadDevice = async (): Promise<void> => {
      let devices = await Camera.getAvailableCameraDevices();
      if (!isMounted) return;

      devices = devices.sort(sortDevices);
      if (deviceType != null) {
        devices = devices.filter((d) => {
          const parsedType = parsePhysicalDeviceTypes(d.devices);
          return parsedType === deviceType;
        });
      }
      setCameraDevices({
        back: devices.find((d) => d.position === 'back'),
        external: devices.find((d) => d.position === 'external'),
        front: devices.find((d) => d.position === 'front'),
        unspecified: devices.find((d) => d.position === 'unspecified'),
      });
    };
    loadDevice();

    return () => {
      isMounted = false;
    };
  }, [deviceType]);

  return cameraDevices;
}
