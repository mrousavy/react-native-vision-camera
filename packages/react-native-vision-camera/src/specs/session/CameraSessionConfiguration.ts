import type { CameraSession } from './CameraSession.nitro'

/**
 * Configuration for a {@linkcode CameraSession}.
 */
export interface CameraSessionConfiguration {
  /**
   * If enabled, the {@linkcode CameraSession} does not interrupt
   * currently playing audio (e.g. music from a different app),
   * while recording.
   *
   * If disabled (the default), any playing audio will be stopped
   * when a recording is started.
   * @default false
   * @platform iOS
   */
  allowBackgroundAudioPlayback?: boolean
}
