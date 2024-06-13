export type PermissionError = 'permission/microphone-permission-denied' | 'permission/camera-permission-denied';
export type ParameterError = 'parameter/invalid-parameter' | 'parameter/unsupported-output' | 'parameter/unsupported-input' | 'parameter/invalid-combination';
export type DeviceError = 'device/configuration-error' | 'device/no-device' | 'device/invalid-device' | 'device/microphone-unavailable' | 'device/pixel-format-not-supported' | 'device/low-light-boost-not-supported' | 'device/focus-not-supported' | 'device/camera-not-available-on-simulator' | 'device/camera-already-in-use';
export type FormatError = 'format/invalid-fps' | 'format/invalid-video-hdr' | 'format/photo-hdr-and-video-hdr-not-suppoted-simultaneously' | 'format/low-light-boost-not-supported-with-hdr' | 'format/invalid-video-stabilization-mode' | 'format/incompatible-pixel-format-with-hdr-setting' | 'format/invalid-format' | 'format/format-required';
export type SessionError = 'session/camera-not-ready' | 'session/audio-in-use-by-other-app' | 'session/no-outputs' | 'session/audio-session-failed-to-activate' | 'session/hardware-cost-too-high' | 'session/invalid-output-configuration';
export type CodeScannerError = 'code-scanner/not-compatible-with-outputs' | 'code-scanner/code-type-not-supported' | 'code-scanner/cannot-load-model';
export type CaptureError = 'capture/recording-in-progress' | 'capture/recording-canceled' | 'capture/no-recording-in-progress' | 'capture/file-io-error' | 'capture/create-temp-file-error' | 'capture/create-recorder-error' | 'capture/insufficient-storage' | 'capture/video-not-enabled' | 'capture/photo-not-enabled' | 'capture/frame-invalid' | 'capture/no-data' | 'capture/recorder-error' | 'capture/focus-canceled' | 'capture/focus-requires-preview' | 'capture/timed-out' | 'capture/snapshot-failed' | 'capture/snapshot-failed-preview-not-enabled' | 'capture/image-data-access-error' | 'capture/encoder-error' | 'capture/invalid-image-type' | 'capture/failed-writing-metadata' | 'capture/unknown';
export type SystemError = 'system/camera-module-not-found' | 'system/camera-is-restricted' | 'system/location-not-enabled' | 'system/no-camera-manager' | 'system/frame-processors-unavailable' | 'system/recording-while-frame-processing-unavailable' | 'system/view-not-found' | 'system/max-cameras-in-use' | 'system/do-not-disturb-bug';
export type UnknownError = 'unknown/unknown';
/**
 * Represents a JSON-style error cause. This contains native `NSError`/`Throwable` information, and can have recursive {@linkcode ErrorWithCause.cause | .cause} properties until the ultimate cause has been found.
 */
export interface ErrorWithCause {
    /**
     * The native error's code.
     *
     * * iOS: `NSError.code`
     * * Android: N/A
     */
    code?: number;
    /**
     * The native error's domain.
     *
     * * iOS: `NSError.domain`
     * * Android: N/A
     */
    domain?: string;
    /**
     * The native error description
     *
     * * iOS: `NSError.message`
     * * Android: `Throwable.message`
     */
    message: string;
    /**
     * Optional additional details
     *
     * * iOS: `NSError.userInfo`
     * * Android: N/A
     */
    details?: Record<string, unknown>;
    /**
     * Optional Java stacktrace
     *
     * * iOS: N/A
     * * Android: `Throwable.stacktrace.toString()`
     */
    stacktrace?: string;
    /**
     * Optional additional cause for nested errors
     *
     * * iOS: N/A
     * * Android: `Throwable.cause`
     */
    cause?: ErrorWithCause;
}
type CameraErrorCode = PermissionError | ParameterError | DeviceError | FormatError | SessionError | CaptureError | SystemError | UnknownError;
/**
 * Represents any kind of error that occured in the {@linkcode Camera} View Module.
 */
declare class CameraError<TCode extends CameraErrorCode> extends Error {
    private readonly _code;
    private readonly _message;
    private readonly _cause?;
    get code(): TCode;
    get message(): string;
    get cause(): Error | undefined;
    /**
     * @internal
     */
    constructor(code: TCode, message: string, cause?: ErrorWithCause);
    toString(): string;
}
/**
 * Represents any kind of error that occured while trying to capture a video or photo.
 *
 * See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.
 */
export declare class CameraCaptureError extends CameraError<CaptureError> {
}
/**
 * Represents any kind of error that occured in the Camera View Module.
 *
 * See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.
 */
export declare class CameraRuntimeError extends CameraError<PermissionError | ParameterError | DeviceError | FormatError | SessionError | SystemError | UnknownError> {
}
/**
 * Checks if the given `error` is of type {@linkcode ErrorWithCause}
 * @param {unknown} error Any unknown object to validate
 * @returns `true` if the given `error` is of type {@linkcode ErrorWithCause}
 */
export declare const isErrorWithCause: (error: unknown) => error is ErrorWithCause;
/**
 * Tries to parse an error coming from native to a typed JS camera error.
 * @param {CameraError} nativeError The native error instance. This is a JSON in the legacy native module architecture.
 * @returns A {@linkcode CameraRuntimeError} or {@linkcode CameraCaptureError}, or the `nativeError` itself if it's not parsable
 * @method
 */
export declare const tryParseNativeCameraError: <T>(nativeError: T) => CameraCaptureError | CameraRuntimeError | T;
export {};
//# sourceMappingURL=CameraError.d.ts.map