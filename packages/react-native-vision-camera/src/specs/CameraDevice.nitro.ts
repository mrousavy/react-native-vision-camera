import type { HybridObject } from "react-native-nitro-modules";


export interface CameraDevice extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
  readonly id: string
}
