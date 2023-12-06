import { useCallback, useEffect, useState } from 'react'
import { Camera, CameraPermissionStatus } from '../Camera'

interface PermissionState {
  /**
   * The current permission status, initially `not-determined`.
   * You can use this to distinguish between when permission status is not yet known,
   * and when it's determined (`granted`, `denied` and more)
   */
  status: CameraPermissionStatus
  /**
   * Whether the specified permission has explicitly been granted.
   * By default, this will be `false`. To request permission, call `requestPermission()`.
   */
  hasPermission: boolean
  /**
   * Requests the specified permission from the user.
   * @returns Whether the specified permission has now been granted, or not.
   */
  requestPermission: () => Promise<boolean>
}

const usePermission = (
  getPermissionStatus: () => Promise<CameraPermissionStatus>,
  requestPermissionFunc: () => Promise<CameraPermissionStatus>,
): PermissionState => {
  const [status, setStatus] = useState<CameraPermissionStatus>('not-determined')

  const requestPermission = useCallback(async () => {
    const result = await requestPermissionFunc()
    const hasPermissionNow = result === 'granted'
    setStatus(result)
    return hasPermissionNow
  }, [requestPermissionFunc])

  useEffect(() => {
    getPermissionStatus().then(setStatus)
  }, [getPermissionStatus])

  return {
    status,
    hasPermission: status === 'granted',
    requestPermission,
  }
}

/**
 * Returns whether the user has granted permission to use the Camera, or not.
 *
 * If the user doesn't grant Camera Permission, you cannot use the `<Camera>`.
 *
 * @example
 * ```tsx
 * const { hasPermission, requestPermission } = useCameraPermission()
 *
 * if (!hasPermission) {
 *   return <PermissionScreen onPress={requestPermission} />
 * } else {
 *   return <Camera ... />
 * }
 * ```
 */
export const useCameraPermission = () => usePermission(Camera.getCameraPermissionStatus, Camera.requestCameraPermission)

/**
 * Returns whether the user has granted permission to use the Microphone, or not.
 *
 * If the user doesn't grant Audio Permission, you can use the `<Camera>` but you cannot
 * record videos with audio (the `audio={..}` prop).
 *
 * @example
 * ```tsx
 * const { hasPermission, requestPermission } = useMicrophonePermission()
 * const canRecordAudio = hasPermission
 *
 * return <Camera video={true} audio={canRecordAudio} />
 * ```
 */
export const useMicrophonePermission = () => usePermission(Camera.getMicrophonePermissionStatus, Camera.requestMicrophonePermission)
