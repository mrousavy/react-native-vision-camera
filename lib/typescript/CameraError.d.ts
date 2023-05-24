export declare type PermissionError = 'permission/microphone-permission-denied' | 'permission/camera-permission-denied';
export declare type ParameterError = 'parameter/invalid-parameter' | 'parameter/unsupported-os' | 'parameter/unsupported-output' | 'parameter/unsupported-input' | 'parameter/invalid-combination';
export declare type DeviceError = 'device/configuration-error' | 'device/no-device' | 'device/invalid-device' | 'device/parallel-video-processing-not-supported' | 'device/torch-unavailable' | 'device/microphone-unavailable' | 'device/low-light-boost-not-supported' | 'device/focus-not-supported' | 'device/camera-not-available-on-simulator';
export declare type FrameProcessorError = 'frame-processor/unavailable';
export declare type FormatError = 'format/invalid-fps' | 'format/invalid-hdr' | 'format/invalid-low-light-boost' | 'format/invalid-format' | 'format/invalid-color-space' | 'format/invalid-preset';
export declare type SessionError = 'session/camera-not-ready' | 'session/audio-session-setup-failed' | 'session/audio-in-use-by-other-app' | 'session/audio-session-failed-to-activate';
export declare type CaptureError = 'capture/invalid-photo-format' | 'capture/encoder-error' | 'capture/muxer-error' | 'capture/recording-in-progress' | 'capture/no-recording-in-progress' | 'capture/file-io-error' | 'capture/create-temp-file-error' | 'capture/invalid-video-options' | 'capture/create-recorder-error' | 'capture/recorder-error' | 'capture/no-valid-data' | 'capture/inactive-source' | 'capture/insufficient-storage' | 'capture/file-size-limit-reached' | 'capture/invalid-photo-codec' | 'capture/not-bound-error' | 'capture/capture-type-not-supported' | 'capture/video-not-enabled' | 'capture/photo-not-enabled' | 'capture/aborted' | 'capture/unknown';
export declare type SystemError = 'system/no-camera-manager' | 'system/view-not-found';
export declare type UnknownError = 'unknown/unknown';
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
declare type CameraErrorCode = PermissionError | ParameterError | DeviceError | FrameProcessorError | FormatError | SessionError | CaptureError | SystemError | UnknownError;
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
 * See the ["Camera Errors" documentation](https://mrousavy.github.io/react-native-vision-camera/docs/guides/errors) for more information about Camera Errors.
 */
export declare class CameraCaptureError extends CameraError<CaptureError> {
}
/**
 * Represents any kind of error that occured in the Camera View Module.
 *
 * See the ["Camera Errors" documentation](https://mrousavy.github.io/react-native-vision-camera/docs/guides/errors) for more information about Camera Errors.
 */
export declare class CameraRuntimeError extends CameraError<PermissionError | ParameterError | DeviceError | FormatError | FrameProcessorError | SessionError | SystemError | UnknownError> {
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
