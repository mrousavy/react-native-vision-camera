import type { HybridObject } from "react-native-nitro-modules";
import type { CameraFormat } from "./CameraFormat.nitro";

export type PhysicalCameraDeviceType = 'ultra-wide-angle-camera' | 'widle-angle-camera' | 'telephoto-camera'

export type CameraPosition = 'front' | 'back' | 'external'

export interface CameraDevice extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
  readonly id: string
  readonly physicalDevices: PhysicalCameraDeviceType[]
  readonly position: CameraPosition
  readonly deviceName: string
  readonly hasFlash: boolean
  readonly formats: CameraFormat[]
}
