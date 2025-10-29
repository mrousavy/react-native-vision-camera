import { useEffect, useState } from 'react'
import type { CameraDevice } from '../specs/CameraDevice.nitro'
import {
  addOnCameraDevicesChangedListener,
  getAllCameraDevices,
} from '../CameraDevices'

export function useCameraDevices(): CameraDevice[] {
  const [devices, setDevices] = useState(() => getAllCameraDevices())

  useEffect(() => {
    const listener = addOnCameraDevicesChangedListener((newDevices) =>
      setDevices(newDevices)
    )
    return () => {
      listener.remove()
    }
  }, [])

  return devices
}
