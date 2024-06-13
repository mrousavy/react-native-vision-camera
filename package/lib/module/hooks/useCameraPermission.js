import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera } from '../Camera';
import { AppState } from 'react-native';
function usePermission(get, request) {
  const [hasPermission, setHasPermission] = useState(() => get() === 'granted');
  const requestPermission = useCallback(async () => {
    const result = await request();
    const hasPermissionNow = result === 'granted';
    setHasPermission(hasPermissionNow);
    return hasPermissionNow;
  }, [request]);
  useEffect(() => {
    // Refresh permission when app state changes, as user might have allowed it in Settings
    const listener = AppState.addEventListener('change', () => {
      setHasPermission(get() === 'granted');
    });
    return () => listener.remove();
  }, [get]);
  return useMemo(() => ({
    hasPermission,
    requestPermission
  }), [hasPermission, requestPermission]);
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
export function useCameraPermission() {
  return usePermission(Camera.getCameraPermissionStatus, Camera.requestCameraPermission);
}

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
export function useMicrophonePermission() {
  return usePermission(Camera.getMicrophonePermissionStatus, Camera.requestMicrophonePermission);
}

/**
 * Returns whether the user has granted permission to use the Location, or not.
 *
 * If the user doesn't grant Location Permission, you can use the `<Camera>` but you cannot
 * capture photos or videos with GPS EXIF tags (the `location={..}` prop).
 *
 * @example
 * ```tsx
 * const { hasPermission, requestPermission } = useLocationPermission()
 * const canCaptureLocation = hasPermission
 *
 * return <Camera photo={true} location={canCaptureLocation} />
 * ```
 */
export function useLocationPermission() {
  return usePermission(Camera.getLocationPermissionStatus, Camera.requestLocationPermission);
}
//# sourceMappingURL=useCameraPermission.js.map