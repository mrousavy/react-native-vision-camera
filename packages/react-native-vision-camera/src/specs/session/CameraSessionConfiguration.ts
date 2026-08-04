import type { CameraSession } from './CameraSession.nitro'

interface AutomaticAudioSessionConfiguration {
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
  allowBackgroundAudioPlayback: boolean
}

interface ManualAudioSessionConfiguration
  extends AutomaticAudioSessionConfiguration {
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
  allowHapticsAndSystemSoundsPlayback: boolean
}

/**
 * Configuration for a {@linkcode CameraSession}.
 */
export interface CameraSessionConfiguration {
  /**
   * Configures the Audio Session.
   *
   * - When set to an {@linkcode AutomaticAudioSessionConfiguration},
   *   the Audio Session will be automatically configured by the
   *   Camera Session, and applies any flags set in
   *   {@linkcode AutomaticAudioSessionConfiguration}.
   * - When set to a {@linkcode ManualAudioSessionConfiguration},
   *   the Audio Session will be manually configured by
   *   VisionCamera, and requires more configuration.
   * - When set to `null`, the Audio Session will not be configured
   *   by VisionCamera at all. This is ideal if you want to configure
   *   your Audio Session fully yourself, for example via expo-audio.
   */
  audioConfiguration?:
    | AutomaticAudioSessionConfiguration
    | ManualAudioSessionConfiguration
    | null
}
