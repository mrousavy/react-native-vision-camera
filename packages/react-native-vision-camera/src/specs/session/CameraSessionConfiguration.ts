import type { CameraSession } from './CameraSession.nitro'

/**
 * Configuration for a {@linkcode CameraSession}.
 */
export interface CameraSessionConfiguration {
  /**
   * If enabled, the device may play haptics/vibrations
   * and system sounds during while the {@linkcode CameraSession}
   * is active.
   *
   * If disabled (the default), all haptics and system
   * sounds will be muted while the {@linkcode CameraSession}
   * is active.
   *
   * @note If {@linkcode allowHapticsAndSystemSoundsPlayback}
   * is true, haptics or system sounds may also be captured
   * in Video recordings.
   * Haptics may also affect stabilization or focus operations.
   *
   * @default false
   * @platform iOS
   */
  allowHapticsAndSystemSoundsPlayback?: boolean
  /**
   * If enabled, the device may play background audio,
   * possibly from another app (e.g. Apple Music) while
   * the {@linkcode CameraSession} is active.
   *
   * If disabled (the default), any playing audio will be
   * stopped while the {@linkcode CameraSession} is active.
   *
   * @note If {@linkcode allowBackgroundAudioPlayback} is true,
   * background audio may also be captured in Video recordings.
   *
   * @default false
   * @platform iOS
   */
  allowBackgroundAudioPlayback?: boolean
}
