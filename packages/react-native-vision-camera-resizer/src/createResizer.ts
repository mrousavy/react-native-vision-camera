import { NitroModules } from 'react-native-nitro-modules'
import type { Resizer } from './specs/Resizer.nitro'
import type {
  ResizerFactory,
  ResizerOptions,
} from './specs/ResizerFactory.nitro'

const factory =
  NitroModules.createHybridObject<ResizerFactory>('ResizerFactory')

/**
 * Create a new {@linkcode Resizer} with the given {@linkcode ResizerOptions}
 * @example
 * ```ts
 * const resizer = await createResizer({
 *   width: 192,
 *   height: 192,
 *   channelOrder: 'rgb',
 *   dataType: 'float32',
 *   scaleMode: 'cover',
 *   pixelLayout: 'planar'
 * })
 * ```
 */
export function createResizer(options: ResizerOptions): Promise<Resizer> {
  return factory.createResizer(options)
}

/**
 * Returns whether the GPU-accelerated Resizer pipeline is available on this device.
 *
 * - On iOS, this requires the Metal GPU framework, which is always available.
 * - On Android, this requires the Vulkan GPU framework and `AHardwareBuffer*` extensions,
 * which are only available on Android SDK 28.
 *
 * @example
 * ```ts
 * function getResizer(options: ResizerOptions): Resizer | CPUFallbackResizer {
 *   if (isResizerAvailable()) {
 *     // GPU accelerated Resizer pipeline is available!
 *     return createResizer(options)
 *   } else {
 *     // GPU accelerated Resizer pipeline is not available on this device,
 *     // fall back to a CPU implementation.
 *     return ...
 *   }
 * }
 * ```
 */
export function isResizerAvailable(): boolean {
  return factory.isAvailable()
}
