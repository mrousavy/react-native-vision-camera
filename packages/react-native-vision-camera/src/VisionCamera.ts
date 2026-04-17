import { NitroModules } from 'react-native-nitro-modules'
import type { CameraFactory } from './specs/CameraFactory.nitro'

/**
 * The native VisionCamera module.
 *
 * This is the entry point for the entire VisionCamera imperative API.
 */
export const VisionCamera =
  NitroModules.createHybridObject<CameraFactory>('CameraFactory')
