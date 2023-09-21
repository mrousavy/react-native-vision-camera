import { useCallback, useEffect, useState } from 'react';
import { Camera } from '../Camera';

interface PermissionState {
  hasPermission: boolean;
  requestPermission: () => void;
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
export function useCameraPermission(): PermissionState {
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async () => {
    const newState = await Camera.requestCameraPermission();
    setHasPermission(newState === 'granted');
  }, []);

  useEffect(() => {
    Camera.getCameraPermissionStatus().then((s) => setHasPermission(s === 'granted'));
  }, []);

  return {
    hasPermission,
    requestPermission,
  };
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
export function useMicrophonePermission(): PermissionState {
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async () => {
    const newState = await Camera.requestMicrophonePermission();
    setHasPermission(newState === 'granted');
  }, []);

  useEffect(() => {
    Camera.getMicrophonePermissionStatus().then((s) => setHasPermission(s === 'granted'));
  }, []);

  return {
    hasPermission,
    requestPermission,
  };
}
