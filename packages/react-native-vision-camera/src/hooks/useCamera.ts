import { useEffect, useMemo } from 'react'
import { getAllCameraDevices } from '../CameraDevices'
import { getCameraDevice } from '../devices/getCameraDevice'
import type { CameraController } from '../specs/CameraController.nitro'
import type { CameraOrientation } from '../specs/common-types/CameraOrientation'
import type { CameraPosition } from '../specs/common-types/CameraPosition'
import type { Constraint } from '../specs/common-types/Constraint'
import type { MirrorMode } from '../specs/common-types/MirrorMode'
import type { OrientationSource } from '../specs/common-types/OrientationSource'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import type { CameraOutput } from '../specs/outputs/CameraOutput.nitro'
import type { CameraVideoOutput } from '../specs/outputs/CameraVideoOutput.nitro'
import type {
  CameraSession,
  InterruptionReason,
} from '../specs/session/CameraSession.nitro'
import type { CameraSessionConfig } from '../specs/session/CameraSessionConfig.nitro'
import { useCameraController } from './internal/useCameraController'
import { useCameraControllerConfiguration } from './internal/useCameraControllerConfiguration'
import { useCameraSession } from './internal/useCameraSession'
import { useCameraSessionIsRunning } from './internal/useCameraSessionIsRunning'
import { useListenerSubscription } from './internal/useListenerSubscription'
import { useStableCallback } from './internal/useStableCallback'
import { useOrientation } from './useOrientation'

export interface CameraProps {
  // Session Configuration
  isActive: boolean
  enableMultiCamSupport?: boolean

  // Connection Configuration
  device: CameraDevice | CameraPosition
  outputs?: CameraOutput[]
  constraints?: Constraint[]
  onSessionConfigSelected?: (config: CameraSessionConfig) => void
  /**
   * Set a desired {@linkcode OrientationSource}
   * for automatically applying {@linkcode CameraOrientation}
   * to all {@linkcode outputs}, or `'custom'` if you
   * prefer to manually specify {@linkcode CameraOrientation}
   * yourself.
   */
  orientationSource?: OrientationSource | 'custom'
  mirrorMode?: MirrorMode

  // Camera Controller Configuration
  enableSmoothAutoFocus?: boolean
  enableLowLightBoost?: boolean
  enableDistortionCorrection?: boolean

  // Initial Props for Controller
  getInitialZoom?: () => number | undefined
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
   */
  onStarted?: () => void
  /**
   * Called when the {@linkcode CameraSession}
   * has been stopped.
   */
  onStopped?: () => void
  /**
   * Called whenever the {@linkcode CameraSession}
   * has encountered an error.
   */
  onError?: (error: Error) => void
  /**
   * Called whenever the {@linkcode CameraSession}
   * has encountered an interruption of the given
   * {@linkcode InterruptionReason}.
   * Interruptions are temporarily.
   */
  onInterruptionStarted?: (interruption: InterruptionReason) => void
  /**
   * Called when a previous interruption
   * has ended and the {@linkcode CameraSession}
   * is running uninterrupted again.
   */
  onInterruptionEnded?: () => void
}

function defaultOnErrorHandler(error: Error) {
  console.error(error)
}

export function useCamera({
  isActive,
  enableMultiCamSupport = false,
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
  enableDistortionCorrection,
  enableLowLightBoost,
  enableSmoothAutoFocus,
  getInitialExposureBias,
  getInitialZoom,
}: CameraProps): CameraController | undefined {
  // 1. Create session
  const session = useCameraSession({
    enableMultiCamSupport: enableMultiCamSupport,
  })

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
