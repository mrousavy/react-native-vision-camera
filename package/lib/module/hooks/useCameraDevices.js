import { useEffect, useState } from 'react';
import { CameraDevices } from '../CameraDevices';

/**
 * Get all available Camera Devices this phone has.
 *
 * Camera Devices attached to this phone (`back` or `front`) are always available,
 * while `external` devices might be plugged in or out at any point,
 * so the result of this function might update over time.
 */
export function useCameraDevices() {
  const [devices, setDevices] = useState(() => CameraDevices.getAvailableCameraDevices());
  useEffect(() => {
    const listener = CameraDevices.addCameraDevicesChangedListener(newDevices => {
      setDevices(newDevices);
    });
    return () => listener.remove();
  }, []);
  return devices;
}
//# sourceMappingURL=useCameraDevices.js.map