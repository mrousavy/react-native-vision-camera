import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { PermissionStatus } from '../specs/common-types/PermissionStatus'
import { VisionCamera } from '../VisionCamera'

/**
 * The state of a Camera or Microphone permission, as returned by
 * {@linkcode useCameraPermission} or {@linkcode useMicrophonePermission}.
 */
export interface PermissionState {
  /**
   * The current raw {@linkcode PermissionStatus}.
   */
  status: PermissionStatus
  /**
   * Requests the permission from the user.
   *
   * Resolves with whether the permission was granted after the request completed.
   * Can only be called if {@linkcode canRequestPermission} is `true`.
   */
  requestPermission: () => Promise<boolean>
  /**
   * Whether the app has been granted this permission ({@linkcode status} is
   * {@linkcode PermissionStatus | 'authorized'}).
   */
  hasPermission: boolean
  /**
   * Whether the app can still request this permission ({@linkcode status} is
   * {@linkcode PermissionStatus | 'not-determined'}). If this is `false` but
   * {@linkcode hasPermission} is also `false`, the user must grant the
   * permission from the system Settings.
   */
  canRequestPermission: boolean
}

function createUsePermissionFunc(
  getFunc: () => PermissionStatus,
  requestFunc: () => Promise<boolean>,
): () => PermissionState {
  return (): PermissionState => {
    const [status, setStatus] = useState<PermissionStatus>(getFunc)

    useEffect(() => {
      // Re-fetch Permission on AppState change
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          setStatus(getFunc())
        }
      })
      return () => subscription.remove()
    }, [])

    const requestPermission = useCallback(async () => {
      await requestFunc()
      const newStatus = getFunc()
      setStatus(newStatus)
      return newStatus === 'authorized'
    }, [])

    return {
      status: status,
      requestPermission: requestPermission,
      hasPermission: status === 'authorized',
      canRequestPermission: status === 'not-determined',
    }
  }
}

/**
 * Use the Camera Permission.
 * @example
 * ```ts
 * const { hasPermission, requestPermission } = useCameraPermission()
 * useEffect(() => {
 *   if (!hasPermission) {
 *     requestPermission()
 *   }
 * }, [hasPermission, requestPermission])
 * ```
 */
export const useCameraPermission = createUsePermissionFunc(
  () => VisionCamera.cameraPermissionStatus,
  () => VisionCamera.requestCameraPermission(),
)

/**
 * Use the Microphone Permission.
 * @example
 * ```ts
 * const { hasPermission, requestPermission } = useMicrophonePermission()
 * useEffect(() => {
 *   if (!hasPermission) {
 *     requestPermission()
 *   }
 * }, [hasPermission, requestPermission])
 * ```
 */
export const useMicrophonePermission = createUsePermissionFunc(
  () => VisionCamera.microphonePermissionStatus,
  () => VisionCamera.requestMicrophonePermission(),
)
