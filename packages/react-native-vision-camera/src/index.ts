import { NitroModules } from 'react-native-nitro-modules'
import { type CameraFactory } from './specs/CameraFactory.nitro'

export const HybridCameraFactory =
  NitroModules.createHybridObject<CameraFactory>('CameraFactory')
