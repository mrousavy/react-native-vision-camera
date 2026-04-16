import type { Image } from 'react-native-nitro-image'
import { NitroModules } from 'react-native-nitro-modules'
import type { Depth } from '../specs/instances/Depth.nitro'
import type { Frame } from '../specs/instances/Frame.nitro'
import type { FrameConverter } from '../specs/utils/FrameConverter.nitro'

/**
 * The {@linkcode HybridFrameConverter} can be used to convert
 * {@linkcode Frame}s and {@linkcode Depth} frames to
 * {@linkcode Image}s.
 */
export const HybridFrameConverter =
  NitroModules.createHybridObject<FrameConverter>('FrameConverter')
