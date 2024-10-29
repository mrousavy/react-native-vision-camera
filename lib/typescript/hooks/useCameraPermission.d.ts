interface PermissionState {
    /**
     * Whether the specified permission has explicitly been granted.
     * By default, this will be `false`. To request permission, call `requestPermission()`.
     */
    hasPermission: boolean;
    /**
     * Requests the specified permission from the user.
     * @returns Whether the specified permission has now been granted, or not.
     */
    requestPermission: () => Promise<boolean>;
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
export declare function useCameraPermission(): PermissionState;
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
export declare function useMicrophonePermission(): PermissionState;
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
export declare function useLocationPermission(): PermissionState;
export {};
//# sourceMappingURL=useCameraPermission.d.ts.map