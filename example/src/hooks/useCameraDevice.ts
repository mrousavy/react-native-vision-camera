import { useEffect, useMemo, useState } from 'react';
import { Camera, CameraDevice, sortDevices } from 'react-native-vision-camera';

/**
 * A custom hook that's just like `useCameraDevices` from VisionCamera, but ignores `'telephoto-camera'` devices since those often have poor quality.
 */
export const useCameraDevice = (): {
  front: CameraDevice | undefined;
  back: CameraDevice | undefined;
} => {
  const [backDevice, setBackDevice] = useState<CameraDevice>();
  const [frontDevice, setFrontDevice] = useState<CameraDevice>();

  useEffect(() => {
    let isMounted = true;

    const loadDevice = async (): Promise<void> => {
      const devices = await Camera.getAvailableCameraDevices();
      if (!isMounted) return;

      // use any device
      const filtered = devices.filter((d) => !d.devices.includes('telephoto-camera'));
      const sorted = filtered.sort(sortDevices);
      const back = sorted.find((d) => d.position === 'back');
      const front = sorted.find((d) => d.position === 'front');
      setBackDevice(back);
      setFrontDevice(front);

      console.log(`Devices: ${sorted.map((d) => d.name).join(', ')}`);
    };
    loadDevice();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      back: backDevice,
      front: frontDevice,
    }),
    [backDevice, frontDevice],
  );
};
