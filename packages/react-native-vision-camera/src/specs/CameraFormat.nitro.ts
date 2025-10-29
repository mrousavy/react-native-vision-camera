import type { HybridObject } from "react-native-nitro-modules";
import type { Resolution } from "./Resolution";

export interface CameraFormat extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
  readonly photoResolution: Resolution
  readonly videoResolution: Resolution
}
