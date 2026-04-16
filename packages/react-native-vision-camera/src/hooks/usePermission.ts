import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { PermissionStatus } from '../specs/common-types/PermissionStatus'
import { VisionCamera } from '../VisionCamera'

export interface PermissionState {
  status: PermissionStatus
  requestPermission: () => Promise<boolean>
  hasPermission: boolean
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
