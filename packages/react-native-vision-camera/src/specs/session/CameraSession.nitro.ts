import type { HybridObject } from 'react-native-nitro-modules'
import type { useCamera } from '../../hooks/useCamera'
import type { CameraController } from '../CameraController.nitro'
import type { CameraFactory } from '../CameraFactory.nitro'
import type { ListenerSubscription } from '../common-types/ListenerSubscription'
import type { CameraDevice } from '../inputs/CameraDevice.nitro'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'
import type { CameraOutputConfiguration } from './CameraOutputConfiguration'
import type { CameraSessionConfiguration } from './CameraSessionConfiguration'
import type { CameraSessionConnection } from './CameraSessionConnection'

export type InterruptionReason =
  | 'video-device-not-available-in-background'
  | 'audio-device-in-use-by-another-client'
  | 'video-device-in-use-by-another-client'
  | 'video-device-not-available-with-multiple-foreground-apps'
  | 'video-device-not-available-due-to-system-pressure'
  | 'sensitive-content-mitigation-activated'
  | 'unknown'

/**
 * Represents a Camera Session.
 *
 * A Camera Session can have {@linkcode CameraSessionConnection}s
 * to stream from an input device ({@linkcode CameraDevice})
 * to an output ({@linkcode CameraOutput}).
 *
 * It is recommended to configure the {@linkcode CameraSession}
 * properly before starting it ({@linkcode start | start()}) to
 * avoid reconfiguration hiccups.
 *
 * You can create and use a Camera Session via the
 * {@linkcode useCamera | useCamera(...)} hook, or by
 * using the imperative APIs directly, which gives you
 * more control over individual properties like
 * {@linkcode CameraOutputConfiguration.mirrorMode | mirrorMode}
 * per output, or multi-cam {@linkcode CameraSession}s.
 *
 * @example
 * Create a Camera Session using the hooks:
 * ```ts
 * const device = ...
 * const photoOutput = ...
 * const camera = useCamera({
 *   isActive: true,
 *   input: device,
 *   outputs: [photoOutput]
 * })
 * ```
 * @example
 * Create a single Camera Session using the imperative API:
 * ```ts
 * const session = await VisionCamera.createCameraSession(false)
 * const [controller] = await session.configure([
 *   {
 *     input: device,
 *     outputs: [
 *       { output: previewOutput, mirrorMode: 'auto' },
 *       { output: photoOutput, mirrorMode: 'auto' },
 *     ],
 *     constraints: []
 *   }
 * ])
 * await session.start()
 * ```
 * @example
 * Create a multi-cam Camera Session to stream from both the front-,
 * and back-Camera using the imperative API:
 * ```ts
 * if (VisionCamera.supportsMultiCamSessions) {
 *   const session = await VisionCamera.createCameraSession(true)
 *   const [frontController, backController] = await session.configure([
 *     // Front Camera
 *     {
 *       input: frontDevice,
 *       outputs: [
 *         { output: frontPreviewOutput, mirrorMode: 'on' },
 *         { output: frontPhotoOutput, mirrorMode: 'off' },
 *       ],
 *       constraints: []
 *     },
 *     // Back Camera
 *     {
 *       input: backDevice,
 *       outputs: [
 *         { output: backPreviewOutput, mirrorMode: 'off' },
 *         { output: backPhotoOutput, mirrorMode: 'off' },
 *       ],
 *       constraints: []
 *     }
 *   ])
 *   await session.start()
 * }
 * ```
 */
export interface CameraSession
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Gets whether this {@linkcode CameraSession} is currently
   * running, or not.
   */
  readonly isRunning: boolean

  /**
   * Configures the {@linkcode CameraSession} with the given
   * {@linkcode connections}, and returns one {@linkcode CameraController}
   * per {@linkcode CameraSessionConnection}.
   *
   * One {@linkcode CameraSessionConnection} defines a connection
   * from one {@linkcode CameraDevice} (the _input_) to multiple
   * {@linkcode CameraOutput}s (the _outputs_).
   *
   * @param connections The list of connections from one _input_ to
   * multiple _outputs_. If this {@linkcode CameraSession} was created
   * as a multi-cam session (see {@linkcode CameraFactory.createCameraSession | createCameraSession(enableMultiCam)}),
   * you can add multiple {@linkcode CameraSessionConnection}s.
   * @param config Configures session-wide configuration,
   * such as {@linkcode CameraSessionConfiguration.allowBackgroundAudioPlayback}.
   *
   * @returns One {@linkcode CameraController} per {@linkcode CameraSessionConnection}.
   *
   * @throws If Camera Permission has not been granted - see {@linkcode CameraFactory.cameraPermissionStatus}
   * @throws If multiple {@linkcode connections} are added, but the
   * {@linkcode CameraSession} was not created as a multi-cam session.
   *
   * @example
   * Creating a simple Preview + Photo connection:
   * ```ts
   * const session = ...
   * const device = ...
   * const [controller] = await session.configure([
   *   {
   *     input: device,
   *     outputs: [
   *       { output: previewOutput, mirrorMode: 'auto' },
   *       { output: photoOutput, mirrorMode: 'auto' },
   *     ],
   *     constraints: []
   *   }
   * ])
   * ```
   * @example
   * Configuring constraints (e.g. 60 FPS):
   * ```ts
   * const session = ...
   * const device = ...
   * const [controller] = await session.configure([
   *   {
   *     input: device,
   *     outputs: [
   *       { output: previewOutput, mirrorMode: 'auto' },
   *       { output: photoOutput, mirrorMode: 'auto' },
   *     ],
   *     constraints: [
   *       { fps: 60 }
   *     ]
   *   }
   * ])
   * await session.start()
   * ```
   * @example
   * Creating a multi-cam session with front- and back Camera:
   * ```ts
   * if (VisionCamera.supportsMultiCamSessions) {
   *   const session = await VisionCamera.createCameraSession(true)
   *   const [frontController, backController] = await session.configure([
   *     // Front Camera
   *     {
   *       input: frontDevice,
   *       outputs: [
   *         { output: frontPreviewOutput, mirrorMode: 'on' },
   *         { output: frontPhotoOutput, mirrorMode: 'off' },
   *       ],
   *       constraints: []
   *     },
   *     // Back Camera
   *     {
   *       input: backDevice,
   *       outputs: [
   *         { output: backPreviewOutput, mirrorMode: 'off' },
   *         { output: backPhotoOutput, mirrorMode: 'off' },
   *       ],
   *       constraints: []
   *     }
   *   ])
   *   await session.start()
   * }
   * ```
   */
  configure(
    connections: CameraSessionConnection[],
    config?: CameraSessionConfiguration,
  ): Promise<CameraController[]>

  /**
   * Starts the {@linkcode CameraSession}.
   *
   * To avoid any runtime hiccups, it's good practice
   * to configure everything via {@linkcode configure | configure(...)}
   * before starting the {@linkcode CameraSession}.
   */
  start(): Promise<void>

  /**
   * Stops the {@linkcode CameraSession}.
   */
  stop(): Promise<void>

  /**
   * Adds a listener to when the {@linkcode CameraSession}
   * started running.
   */
  addOnStartedListener(onStarted: () => void): ListenerSubscription
  /**
   * Adds a listener to when the {@linkcode CameraSession}
   * stopped running.
   */
  addOnStoppedListener(onStopped: () => void): ListenerSubscription
  /**
   * Adds a listener to when the {@linkcode CameraSession}
   * encountered an error.
   */
  addOnErrorListener(onError: (error: Error) => void): ListenerSubscription

  /**
   * Adds a listener to when the {@linkcode CameraSession}
   * was interrupted, for example when the phone overheated,
   * or the user received a FaceTime call.
   */
  addOnInterruptionStartedListener(
    onInterruptionStarted: (reason: InterruptionReason) => void,
  ): ListenerSubscription
  /**
   * Adds a listener to when a {@linkcode CameraSession}
   * interruption has ended and the Camera continues
   * to run again.
   */
  addOnInterruptionEndedListener(
    onInterruptionEnded: () => void,
  ): ListenerSubscription
}
