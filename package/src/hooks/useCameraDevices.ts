import { useEffect, useRef, useState } from 'react'
import type { CameraDevice } from '../types/CameraDevice'
import { CameraDevices } from '../CameraDevices'

/**
 * Get all available Camera Devices this phone has.
 *
 * Camera Devices attached to this phone (`back` or `front`) are always available,
 * while `external` devices might be plugged in or out at any point,
 * so the result of this function might update over time.
 */
export function useCameraDevices(): CameraDevice[] {
  const [devices, setDevices] = useState(() => CameraDevices.getAvailableCameraDevices())
  const numberOfDevicesRef = useRef(devices.length)

  useEffect(() => {
    let isMounted = true
    const listener = CameraDevices.addCameraDevicesChangedListener((newDevices) => {
      setDevices(newDevices)
    })
    // Only update if we got new devices and the component is still mounted
    // This happens with Android only
    if (numberOfDevicesRef.current === 0) {
      CameraDevices.getAvailableCameraDevicesManually().then((newDevices) => {
        if (isMounted && newDevices.length > 0) {
          setDevices(newDevices)
        }
      })
    }
    return () => {
      isMounted = false
      listener.remove()
    }
  }, [])

  return devices
}
