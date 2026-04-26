import type { CameraSession } from './CameraSession.nitro'

/**
 * Configuration for a {@linkcode CameraSession}.
 */
export interface CameraSessionConfiguration {
  /**
   * Whether the underlying iOS `AVCaptureSession`s should automatically
   * configure the application's `AVAudioSession` while recording audio.
   *
   * Disable this if you want to fully manage the app-wide
   * `AVAudioSession` yourself, for example via
   * `react-native-volume-manager`.
   *
   * This setting also applies to the persistent recorder's
   * dedicated audio capture session.
   *
   * If disabled, {@linkcode allowBackgroundAudioPlayback} has no effect.
   *
   * @default true
   * @platform iOS
   */
  automaticallyConfiguresApplicationAudioSession?: boolean
  /**
   * If enabled, the {@linkcode CameraSession} does not interrupt
   * currently playing audio (e.g. music from a different app),
   * while recording.
   *
   * If disabled (the default), any playing audio will be stopped
   * when a recording is started.
   *
   * This only applies when
   * {@linkcode automaticallyConfiguresApplicationAudioSession}
   * is enabled.
   * @default false
   * @platform iOS
   */
  allowBackgroundAudioPlayback?: boolean
}
