import { useEffect, useState } from 'react';
import { sortDevices } from '../utils/FormatFilter';
import { Camera } from '../Camera';
import { parsePhysicalDeviceTypes } from '../CameraDevice';
const DefaultCameraDevices = {
  back: undefined,
  external: undefined,
  front: undefined,
  unspecified: undefined
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

export function useCameraDevices(deviceType) {
  const [cameraDevices, setCameraDevices] = useState(DefaultCameraDevices);
  useEffect(() => {
    let isMounted = true;

    const loadDevice = async () => {
      let devices = await Camera.getAvailableCameraDevices();
      if (!isMounted) return;
      devices = devices.sort(sortDevices);

      if (deviceType != null) {
        devices = devices.filter(d => {
          const parsedType = parsePhysicalDeviceTypes(d.devices);
          return parsedType === deviceType;
        });
      }

      setCameraDevices({
        back: devices.find(d => d.position === 'back'),
        external: devices.find(d => d.position === 'external'),
        front: devices.find(d => d.position === 'front'),
        unspecified: devices.find(d => d.position === 'unspecified')
      });
    };

    loadDevice();
    return () => {
      isMounted = false;
    };
  }, [deviceType]);
  return cameraDevices;
}
//# sourceMappingURL=useCameraDevices.js.map