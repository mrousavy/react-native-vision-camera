import { useMMKVString } from 'react-native-mmkv'
import { CameraDevice } from '../../../src/CameraDevice'
import { useCallback, useMemo } from 'react'
import { useCameraDevices } from '../../../src/hooks/useCameraDevices'

export function usePreferredCameraDevice(): [CameraDevice | undefined, (device: CameraDevice) => void] {
  const [preferredDeviceId, setPreferredDeviceId] = useMMKVString('camera.preferredDeviceId')

  const set = useCallback(
    (device: CameraDevice) => {
      setPreferredDeviceId(device.id)
    },
    [setPreferredDeviceId],
  )

  const devices = useCameraDevices()
  const device = useMemo(() => devices.find((d) => d.id === preferredDeviceId), [devices, preferredDeviceId])

  return [device, set]
}
