import type { CameraDevice } from 'react-native-vision-camera'

export function logDevices(devices: CameraDevice[]): void {
  for (const d of devices) {
    console.log(`${d.id}: ${d.type} ${d.position} ("${d.localizedName}")`)
  }
}
