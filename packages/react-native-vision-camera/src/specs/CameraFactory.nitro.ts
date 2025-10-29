import type { HybridObject } from "react-native-nitro-modules";
import type { CameraDevice } from "./CameraDevice.nitro";

interface ListenerSubscription {
  remove: () => void
}

export interface CameraFactory extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
  readonly cameraDevices: CameraDevice[]
  addOnCameraDevicesChangedListener(listener: (newDevices: CameraDevice[]) => void): ListenerSubscription
}
