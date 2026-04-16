import type { HybridObject } from 'react-native-nitro-modules'

import type { CameraController } from '../CameraController.nitro'
import type { CameraFactory } from '../CameraFactory.nitro'
import type {
  PreviewView,
  PreviewViewMethods,
} from '../views/PreviewView.nitro'

/**
 * Represents a point that can be used for focusing AE/AF/AWB
 * on the Camera via {@linkcode CameraController}.
 *
 * You can create a {@linkcode MeteringPoint} via a {@linkcode PreviewView}'s
 * `ref` (see {@linkcode PreviewViewMethods.createMeteringPoint | PreviewViewMethods.createMeteringPoint(...)}), or manually
 * via {@linkcode CameraFactory.createNormalizedMeteringPoint | CameraFactory.createNormalizedMeteringPoint(...)}.
 *
 * @example
 * Creating a Metering Point to the logical center of the Camera:
 * ```ts
 * const controller = ...
 * const meteringPoint = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5)
 * await controller.focusTo(meteringPoint, {})
 * ```
 * @example
 * Creating a Metering Point from a Preview View:
 * ```tsx
 * function App() {
 *   const previewView = useRef<PreviewView>(null)
 *   const controller = ...
 *
 *   const onTap = async (viewX, viewY) => {
 *     const meteringPoint = previewView.current?.createMeteringPoint(viewX, viewY)
 *     await controller.focusTo(meteringPoint, {})
 *   }
 *
 *   return (
 *     <NativePreviewView
 *       {...props}
 *       ref={previewView}
 *     />
 *   )
 * }
 * ```
 */
export interface MeteringPoint
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Represents the X coordinate of this {@linkcode MeteringPoint},
   * relative to whatever source was used to create this point.
   *
   * - If created from a {@linkcode PreviewView}, this will be the
   * given View X coordinate (e.g. of the user tap).
   * - If created from a normalized Point ({@linkcode CameraFactory.createNormalizedMeteringPoint | CameraFactory.createNormalizedMeteringPoint()}),
   * this will be the given normalized X coordinate (0...1)
   */
  readonly relativeX: number
  /**
   * Represents the Y coordinate of this {@linkcode MeteringPoint},
   * relative to whatever source was used to create this point.
   *
   * - If created from a {@linkcode PreviewView}, this will be the
   * given View Y coordinate (e.g. of the user tap).
   * - If created from a normalized Point ({@linkcode CameraFactory.createNormalizedMeteringPoint | CameraFactory.createNormalizedMeteringPoint()}),
   * this will be the given normalized Y coordinate (0...1)
   */
  readonly relativeY: number
  /**
   * Represents the size/radius of this {@linkcode MeteringPoint},
   * relative to whatever source was used to create this point - or
   * `undefined` if no relative size was set.
   */
  readonly relativeSize?: number

  /**
   * Represents the X coordinate of this {@linkcode MeteringPoint},
   * normalized to the Camera's coordinate system after applying
   * orientation, cropping, and scaling.
   */
  readonly normalizedX: number
  /**
   * Represents the Y coordinate of this {@linkcode MeteringPoint},
   * normalized to the Camera's coordinate system after applying
   * orientation, cropping, and scaling.
   */
  readonly normalizedY: number
  /**
   * Represents the size of this {@linkcode MeteringPoint},
   * normalized to the Camera's coordinate system after applying
   * orientation, cropping, and scaling.
   */
  readonly normalizedSize: number
}
