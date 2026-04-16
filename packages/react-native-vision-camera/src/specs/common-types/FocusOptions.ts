import type { CameraController } from '../CameraController.nitro'
import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Specifies the metering mode, also known as the 3A operation.
 * - `'AE'`: Auto-Exposure - requires {@linkcode CameraDevice.supportsExposureMetering}
 * - `'AF'`: Auto-Focus - requires {@linkcode CameraDevice.supportsFocusMetering}
 * - `'AWB'`: Auto-White-Balance - requires {@linkcode CameraDevice.supportsWhiteBalanceMetering}
 *
 * @see {@linkcode CameraController.focusTo | CameraController.focusTo(...)}
 * @see {@linkcode FocusOptions}
 */
export type MeteringMode = 'AE' | 'AF' | 'AWB'

/**
 * Configures the responsiveness of a AE/AF/AWB focus operation.
 * - `'steady'`: Steadily focuses to the specified point of
 *   interest without disrupting. Most desireable for filming videos.
 * - `'snappy'`: Snappily focuses to the specified point of
 *   interest as fast as possible, possibly resetting focus.
 *   Most desireable while not filming, or capturing photos.
 *
 * @see {@linkcode CameraController.focusTo | CameraController.focusTo(...)}
 * @see {@linkcode FocusOptions}
 */
export type FocusResponsiveness = 'steady' | 'snappy'
/**
 * Configures the adaptiveness of the AE/AF/AWB pipeline after a metering operation has settled.
 * - `'continuous'`: Continuously keeps the target point relative
 *   to the screen in focus, adapting AE/AF/AWB values if the subject area changes.
 * - `'locked'`: Keeps the AE/AF/AWB values locked in-place after
 *   the metering operation has settled even if the subject area changes,
 *   until focus is manually reset via {@linkcode CameraController.resetFocus | CameraController.resetFocus()}
 *   or another focus metering operation starts.
 *
 * @see {@linkcode CameraController.focusTo | CameraController.focusTo(...)}
 * @see {@linkcode FocusOptions}
 */
export type SceneAdaptiveness = 'continuous' | 'locked'

/**
 * Options for a focus metering operation via
 * {@linkcode CameraController.focusTo | CameraController.focusTo(...)}
 */
export interface FocusOptions {
  /**
   * The responsiveness of the metering operation.
   * @see {@linkcode FocusResponsiveness}
   * @default 'snappy'
   */
  responsiveness?: FocusResponsiveness
  /**
   * The adaptiveness to changes in the scene.
   * @see {@linkcode SceneAdaptiveness}
   * @default 'continuous'
   */
  adaptiveness?: SceneAdaptiveness
  /**
   * The metering modes to run this focus operation on.
   *
   * By default, all {@linkcode MeteringMode}s that are supported
   * on the device will be enabled - so ideally 3A.
   *
   * When passing a custom value, you are responsible for ensuring
   * that the given modes are compatible - e.g. when passing `['AF']`
   * you must ensure that the {@linkcode CameraDevice} supports focus
   * metering - see {@linkcode CameraDevice.supportsFocusMetering}.
   *
   * @see {@linkcode MeteringMode}
   * @default ['AE', 'AF', 'AWB']
   */
  modes?: MeteringMode[]
  /**
   * - If set to a `number`, the focus will automatically reset itself to
   * continuous auto focus again after it has been stable for the duration
   * specified in {@linkcode autoResetAfter} - in seconds.
   * - If set to `null`, the focus stays locked until you manually
   * call {@linkcode CameraController.resetFocus | resetFocus()}, or schedule
   * another focus operation via {@linkcode CameraController.focusTo | focusTo(...)}
   *
   * @default 5
   */
  autoResetAfter?: number | null
}
