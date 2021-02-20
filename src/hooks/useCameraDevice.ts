import { useEffect, useState } from 'react';
import { Camera } from '../Camera';
import { CameraDevice, LogicalCameraDeviceType, parsePhysicalDeviceTypes, PhysicalCameraDeviceType } from '../CameraDevice';

export const useCameraDevice = (deviceType: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevice | undefined => {
  const [device, setDevice] = useState<CameraDevice>();

  useEffect(() => {
    const loadDevice = async (): Promise<void> => {
      const devices = await Camera.getAvailableCameraDevices();
      const bestMatch = devices.find((d) => {
        const parsedType = parsePhysicalDeviceTypes(d.devices);
        return parsedType === deviceType;
      });
      setDevice(bestMatch);
    };
    loadDevice();
  }, [deviceType]);

  return device;
};
