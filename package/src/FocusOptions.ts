import { Point } from './Point'

/**
 * * `af`: Auto-Focus (depth)
 * * `ae`: Auto-Exposure (brightness)
 * * `awb`: Auto-White-Balance (colors)
 */
export type FocusMode = 'af' | 'ae' | 'awb'

export interface FocusOptions {
  /**
   * The point to focus AE, AF or AWB to. This should be relative
   * to the Camera view's coordinate system and is expressed in points.
   *  * `(0, 0)` means **top left**.
   *  * `(CameraView.width, CameraView.height)` means **bottom right**.
   *
   * Make sure the value doesn't exceed the CameraView's dimensions.
   */
  point: Point
  /**
   * The setting modes to focus to the specified point.
   *
   * If not set, all settings will be used for focusing.
   *
   * * `af`: Auto-Focus (depth)
   * * `ae`: Auto-Exposure (brightness)
   * * `awb`: Auto-White-Balance (colors)
   *
   * For example, if you only want to focus the AF (auto-focus/depth) setting but not exposure/colors, use:
   *
   * ```ts
   * camera.current.focus({
   *   point: {
   *     x: x,
   *     y: y
   *   },
   *   modes: ['af']
   * })
   * ```
   *
   * @default ['af', 'ae', 'awb']
   */
  modes?: FocusMode[]
}
