"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryParseNativeCameraError = exports.isErrorWithCause = exports.CameraRuntimeError = exports.CameraCaptureError = void 0;
/**
 * Represents a JSON-style error cause. This contains native `NSError`/`Throwable` information, and can have recursive {@linkcode ErrorWithCause.cause | .cause} properties until the ultimate cause has been found.
 */

/**
 * Represents any kind of error that occured in the {@linkcode Camera} View Module.
 */
class CameraError extends Error {
  get code() {
    return this._code;
  }
  get message() {
    return this._message;
  }
  get cause() {
    const c = this._cause;
    if (c == null) return undefined;
    return new Error(`[${c.code}]: ${c.message}`);
  }

  /**
   * @internal
   */
  constructor(code, message, cause) {
    super(`[${code}]: ${message}${cause != null ? ` (Cause: ${cause.message})` : ''}`);
    super.name = code;
    super.message = message;
    this._code = code;
    this._message = message;
    this._cause = cause;
  }
  toString() {
    let string = `[${this.code}]: ${this.message}`;
    if (this._cause != null) string += ` (caused by ${JSON.stringify(this._cause)})`;
    return string;
  }
}

/**
 * Represents any kind of error that occured while trying to capture a video or photo.
 *
 * See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.
 */
class CameraCaptureError extends CameraError {}

/**
 * Represents any kind of error that occured in the Camera View Module.
 *
 * See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.
 */
exports.CameraCaptureError = CameraCaptureError;
class CameraRuntimeError extends CameraError {}

/**
 * Checks if the given `error` is of type {@linkcode ErrorWithCause}
 * @param {unknown} error Any unknown object to validate
 * @returns `true` if the given `error` is of type {@linkcode ErrorWithCause}
 */
exports.CameraRuntimeError = CameraRuntimeError;
const isErrorWithCause = error => typeof error === 'object' && error != null &&
// @ts-expect-error error is still unknown
typeof error.message === 'string' && (
// @ts-expect-error error is still unknown
typeof error.stacktrace === 'string' || error.stacktrace == null) && (
// @ts-expect-error error is still unknown
isErrorWithCause(error.cause) || error.cause == null);
exports.isErrorWithCause = isErrorWithCause;
const isCameraErrorJson = error => typeof error === 'object' && error != null &&
// @ts-expect-error error is still unknown
typeof error.code === 'string' &&
// @ts-expect-error error is still unknown
typeof error.message === 'string' && (
// @ts-expect-error error is still unknown
typeof error.cause === 'object' || error.cause == null);

/**
 * Tries to parse an error coming from native to a typed JS camera error.
 * @param {CameraError} nativeError The native error instance. This is a JSON in the legacy native module architecture.
 * @returns A {@linkcode CameraRuntimeError} or {@linkcode CameraCaptureError}, or the `nativeError` itself if it's not parsable
 * @method
 */
const tryParseNativeCameraError = nativeError => {
  if (isCameraErrorJson(nativeError)) {
    if (nativeError.code.startsWith('capture')) {
      return new CameraCaptureError(nativeError.code, nativeError.message, nativeError.cause);
    } else {
      return new CameraRuntimeError(
      // @ts-expect-error the code is string, we narrow it down to TS union.
      nativeError.code, nativeError.message, nativeError.cause);
    }
  } else {
    return nativeError;
  }
};
exports.tryParseNativeCameraError = tryParseNativeCameraError;
//# sourceMappingURL=CameraError.js.map