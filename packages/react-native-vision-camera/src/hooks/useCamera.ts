import { useEffect, useMemo } from 'react'
import { getAllCameraDevices } from '../CameraDevices'
import { getCameraDevice } from '../devices/getCameraDevice'
import type {
  CameraController,
  CameraControllerConfiguration,
} from '../specs/CameraController.nitro'
import type { CameraOrientation } from '../specs/common-types/CameraOrientation'
import type { CameraPosition } from '../specs/common-types/CameraPosition'
import type { Constraint } from '../specs/common-types/Constraint'
import type { MirrorMode } from '../specs/common-types/MirrorMode'
import type { OrientationSource } from '../specs/common-types/OrientationSource'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import type { CameraOutput } from '../specs/outputs/CameraOutput.nitro'
import type { CameraVideoOutput } from '../specs/outputs/CameraVideoOutput.nitro'
import type { CameraOutputConfiguration } from '../specs/session/CameraOutputConfiguration'
import type {
  CameraSession,
  InterruptionReason,
} from '../specs/session/CameraSession.nitro'
import type { CameraSessionConfig } from '../specs/session/CameraSessionConfig.nitro'
import type { CameraSessionConnection } from '../specs/session/CameraSessionConnection'
import { useCameraController } from './internal/useCameraController'
import { useCameraControllerConfiguration } from './internal/useCameraControllerConfiguration'
import { useCameraSession } from './internal/useCameraSession'
import { useCameraSessionIsRunning } from './internal/useCameraSessionIsRunning'
import { useListenerSubscription } from './internal/useListenerSubscription'
import { useStableCallback } from './internal/useStableCallback'
import { useOrientation } from './useOrientation'

export interface CameraProps {
  // Session Configuration
  /**
   * Starts the {@linkcode CameraSession} when set to `true`, and stops it
   * when set back to `false`.
   *
   * @see {@linkcode CameraSession.start | CameraSession.start()}
   * @see {@linkcode CameraSession.stop | CameraSession.stop()}
   * @see {@linkcode CameraSession.isRunning}
   */
  isActive: boolean

  // Connection Configuration
  /**
   * The {@linkcode CameraDevice} to open, or a {@linkcode CameraPosition}
   * (e.g. `'back'`) to auto-pick a matching device via
   * {@linkcode getCameraDevice | getCameraDevice(...)}.
   *
   * @see {@linkcode CameraSessionConnection.input}
   */
  device: CameraDevice | CameraPosition
  /**
   * The {@linkcode CameraOutput}s the {@linkcode device} will stream into.
   *
   * @see {@linkcode CameraSessionConnection.outputs}
   * @see {@linkcode CameraOutputConfiguration.output}
   */
  outputs?: CameraOutput[]
  /**
   * {@linkcode Constraint}s (e.g. `{ fps: 60 }`) that the Camera pipeline
   * will try to match when configuring the {@linkcode CameraSession}.
   *
   * @see {@linkcode CameraSessionConnection.constraints}
   */
  constraints?: Constraint[]
  /**
   * Called once the given {@linkcode constraints} have been fully resolved
   * into a concrete {@linkcode CameraSessionConfig}.
   *
   * @see {@linkcode CameraSessionConnection.onSessionConfigSelected}
   */
  onSessionConfigSelected?: (config: CameraSessionConfig) => void
  /**
   * Set a desired {@linkcode OrientationSource}
   * for automatically applying {@linkcode CameraOrientation}
   * to all {@linkcode outputs}, or `'custom'` if you
   * prefer to manually specify {@linkcode CameraOrientation}
   * yourself.
   *
   * @see {@linkcode CameraOutput.outputOrientation}
   */
  orientationSource?: OrientationSource | 'custom'
  /**
   * Sets whether the {@linkcode CameraOutput}s are mirrored along
   * the vertical axis. {@linkcode MirrorMode | 'auto'} mirrors
   * automatically on selfie cameras.
   *
   * @see {@linkcode CameraOutputConfiguration.mirrorMode}
   * @default 'auto'
   */
  mirrorMode?: MirrorMode

  // Camera Controller Configuration
  /**
   * If `true`, auto-focus transitions are performed slower and smoother
   * to appear less intrusive in video recordings.
   *
   * @see {@linkcode CameraControllerConfiguration.enableSmoothAutoFocus}
   * @platform iOS
   * @default false
   */
  enableSmoothAutoFocus?: boolean
  /**
   * If `true`, the Camera pipeline may extend exposure times (effectively
   * dropping frame rate) in low-light scenes to receive more light.
   *
   * @see {@linkcode CameraControllerConfiguration.enableLowLightBoost}
   * @default false
   */
  enableLowLightBoost?: boolean
  /**
   * If `true`, geometric distortion at the edges (e.g. on ultra-wide-angle
   * cameras) is corrected, at the cost of a small amount of field of view.
   *
   * @see {@linkcode CameraControllerConfiguration.enableDistortionCorrection}
   * @platform iOS
   * @default true
   */
  enableDistortionCorrection?: boolean

  // Initial Props for Controller
  /**
   * A getter for the initial zoom value to apply when the
   * {@linkcode CameraController} is created. Later, the zoom can be
   * adjusted via {@linkcode CameraController.setZoom | CameraController.setZoom(...)}.
   *
   * @see {@linkcode CameraSessionConnection.initialZoom}
   */
  getInitialZoom?: () => number | undefined
  /**
   * A getter for the initial exposure bias to apply when the
   * {@linkcode CameraController} is created. Later, the exposure bias can be
   * adjusted via {@linkcode CameraController.setExposureBias | CameraController.setExposureBias(...)}.
   *
   * @see {@linkcode CameraSessionConnection.initialExposureBias}
   */
  getInitialExposureBias?: () => number | undefined

  // Callbacks
  /**
   * Called whenever the {@linkcode CameraSession}
   * has been configured with new connections via
   * {@linkcode CameraSession.configure | configure(...)}
   * and connections to the individual outputs are formed.
   *
   * This is a good place to check output
   * capabilities, such as {@linkcode CameraVideoOutput.getSupportedVideoCodecs | CameraVideoOutput.getSupportedVideoCodecs()}
   */
  onConfigured?: () => void
  /**
   * Called when the {@linkcode CameraSession}
   * has been started.
   *
   * @see {@linkcode CameraSession.addOnStartedListener}
   */
  onStarted?: () => void
  /**
   * Called when the {@linkcode CameraSession}
   * has been stopped.
   *
   * @see {@linkcode CameraSession.addOnStoppedListener}
   */
  onStopped?: () => void
  /**
   * Called whenever the {@linkcode CameraSession}
   * has encountered an error.
   *
   * @see {@linkcode CameraSession.addOnErrorListener}
   */
  onError?: (error: Error) => void
  /**
   * Called whenever the {@linkcode CameraSession}
   * has encountered an interruption of the given
   * {@linkcode InterruptionReason}.
   * Interruptions are temporarily.
   *
   * @see {@linkcode CameraSession.addOnInterruptionStartedListener}
   */
  onInterruptionStarted?: (interruption: InterruptionReason) => void
  /**
   * Called when a previous interruption
   * has ended and the {@linkcode CameraSession}
   * is running uninterrupted again.
   *
   * @see {@linkcode CameraSession.addOnInterruptionEndedListener}
   */
  onInterruptionEnded?: () => void
  /**
   * Called when the subject area substantially changes,
   * e.g. when the user pans away from a scene that was
   * previously in focus.
   *
   * This is a good point to reset any locked AE/AF/AWB
   * focus states back to continuously auto-focus.
   *
   * @see {@linkcode CameraController.addSubjectAreaChangedListener}
   * @platform iOS
   */
  onSubjectAreaChanged?: () => void
}

function defaultOnErrorHandler(error: Error) {
  console.error(error)
}

/**
 * Use the Camera.
 *
 * This creates a {@linkcode CameraSession}, manages
 * the input and outputs (including orientation and
 * mirrorm odes), wraps listeners as stable React
 * callbacks, and returns a {@linkcode CameraController}.
 *
 * @example
 * ```ts
 * const camera = useCamera({
 *   isActive: true,
 *   device: 'back',
 *   outputs: []
 * })
 * ```
 */
export function useCamera({
  isActive,
  device,
  outputs = [],
  constraints,
  onSessionConfigSelected,
  mirrorMode,
  onConfigured,
  orientationSource = 'device',
  onStarted,
  onStopped,
  onError = defaultOnErrorHandler,
  onInterruptionStarted,
  onInterruptionEnded,
  onSubjectAreaChanged,
  enableDistortionCorrection,
  enableLowLightBoost,
  enableSmoothAutoFocus,
  getInitialExposureBias,
  getInitialZoom,
}: CameraProps): CameraController | undefined {
  // 1. Create session
  const session = useCameraSession({ enableMultiCamSupport: false })

  // 2. Update output orientations
  const orientationSourceOrUndefined =
    orientationSource === 'custom' ? undefined : orientationSource
  const orientation = useOrientation(orientationSourceOrUndefined)
  useEffect(() => {
    if (orientation == null) return
    for (const output of outputs) {
      output.outputOrientation = orientation
    }
  }, [orientation, outputs])

  // 3. Get the input - either find one via position, or use the user provided one
  const input = useMemo(() => {
    if (typeof device === 'string') {
      // The user passed a `CameraPosition` (e.g. "back") - try to find a device ourselves
      const position = device
      const devices = getAllCameraDevices()
      const foundDevice = getCameraDevice(devices, position)
      if (foundDevice == null) {
        throw new Error(`This device does not have any "${position}" Cameras!`)
      }
      return foundDevice
    } else {
      // The user passed an actual device. return as-is.
      return device
    }
  }, [device])

  // 4. Configure the session with the input + outputs to create a `CameraController`
  const controller = useCameraController(session, input, outputs, {
    mirrorMode: mirrorMode,
    onConfigured: onConfigured,
    getInitialExposureBias: getInitialExposureBias,
    getInitialZoom: getInitialZoom,
    constraints: constraints,
    onSessionConfigSelected: onSessionConfigSelected,
  })

  // 5. Configure the Controller with some settings
  useCameraControllerConfiguration(controller, {
    enableSmoothAutoFocus: enableSmoothAutoFocus,
    enableDistortionCorrection: enableDistortionCorrection,
    enableLowLightBoost: enableLowLightBoost,
  })

  // 6. Start (or stop) the Session if we have a Controller and `isActive` is true.
  const hasController = controller != null
  useCameraSessionIsRunning(session, isActive && hasController)

  // 7. Set up listeners and delegate to JS
  useListenerSubscription(session, 'addOnStartedListener', onStarted)
  useListenerSubscription(session, 'addOnStoppedListener', onStopped)
  useListenerSubscription(session, 'addOnErrorListener', onError)
  useListenerSubscription(
    session,
    'addOnInterruptionStartedListener',
    onInterruptionStarted,
  )
  useListenerSubscription(
    session,
    'addOnInterruptionEndedListener',
    onInterruptionEnded,
  )
  useListenerSubscription(
    controller,
    'addSubjectAreaChangedListener',
    onSubjectAreaChanged,
  )

  // 8. On unmount, dispose the controller & session.
  const cleanup = useStableCallback(() => {
    controller?.dispose()
    session?.dispose()
  })
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // 9. Give the user the controller
  return controller
}
