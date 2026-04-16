import { NitroModules } from 'react-native-nitro-modules'
import type { CameraFactory } from './specs/CameraFactory.nitro'

/**
 * The native VisionCamera module.
 */
export const VisionCamera =
  NitroModules.createHybridObject<CameraFactory>('CameraFactory')
