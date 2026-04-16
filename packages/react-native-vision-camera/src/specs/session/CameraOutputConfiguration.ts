import type { MirrorMode } from '../common-types/MirrorMode'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'
import type { CameraSession } from './CameraSession.nitro'
import type { CameraSessionConnection } from './CameraSessionConnection'

/**
 * Specifies options for an output in a {@linkcode CameraSessionConnection}
 * used in {@linkcode CameraSession.configure | CameraSession.configure(...)}.
 */
export interface CameraOutputConfiguration {
  /**
   * Sets whether the {@linkcode CameraOutput}
   * is mirrored alongside the vertical axis, or not.
   *
   * By default, {@linkcode mirrorMode} is set to
   * {@linkcode MirrorMode | 'auto'}, which automatically
   * enables video mirroring if the device suggests it -
   * for example on selfie cameras.
   * @default 'auto'
   */
  mirrorMode: MirrorMode
  /**
   * The {@linkcode CameraOutput}.
   */
  output: CameraOutput
}
