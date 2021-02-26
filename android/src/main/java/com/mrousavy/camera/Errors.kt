package com.mrousavy.camera

import android.graphics.ImageFormat

abstract class CameraError(
  /**
   * The domain of the error. Error domains are used to group errors.
   *
   * Example: "permission"
   */
  val domain: String,
  /**
   * The id of the error. Errors are uniquely identified under a given domain.
   *
   * Example: "microphone-permission-denied"
   */
  val id: String,
  /**
   * A detailed error description of "what went wrong".
   *
   * Example: "The microphone permission was denied!"
   */
  message: String,
  /**
   * A throwable that caused this error.
   */
  cause: Throwable? = null
) : Throwable("[$domain/$id] $message", cause)

val CameraError.code: String
  get() = "$domain/$id"

class MicrophonePermissionError : CameraError("permission", "microphone-permission-denied", "The Microphone permission was denied!")
class CameraPermissionError : CameraError("permission", "camera-permission-denied", "The Camera permission was denied!")

class InvalidTypeScriptUnionError(unionName: String, unionValue: String) : CameraError("parameter", "invalid-parameter", "The given value for $unionName could not be parsed! (Received: $unionValue)")
class UnsupportedOSError(unionName: String, unionValue: String, supportedOnOS: String) : CameraError("parameter", "unsupported-os", "The given value \"$unionValue\" could not be used for $unionName, as it is only available on Android $supportedOnOS and above!")

class NoCameraDeviceError : CameraError("device", "no-device", "No device was set! Use `getAvailableCameraDevices()` to select a suitable Camera device.")
class InvalidCameraDeviceError(cause: Throwable) : CameraError("device", "invalid-device", "The given Camera device could not be found for use-case binding!", cause)

class FpsNotContainedInFormatError(fps: Int) : CameraError("format", "invalid-fps", "The given FPS were not valid for the currently selected format. Make sure you select a format which `frameRateRanges` includes $fps FPS!")
class HdrNotContainedInFormatError() : CameraError(
  "format", "invalid-hdr",
  "The currently selected format does not support HDR capture! " +
    "Make sure you select a format which `frameRateRanges` includes `supportsPhotoHDR`!"
)
class LowLightBoostNotContainedInFormatError() : CameraError(
  "format", "invalid-low-light-boost",
  "The currently selected format does not support low-light boost (night mode)! " +
    "Make sure you select a format which includes `supportsLowLightBoost`."
)

class CameraNotReadyError : CameraError("session", "camera-not-ready", "The Camera is not ready yet! Wait for the onInitialized() callback!")

class InvalidFormatError(format: Int) : CameraError("capture", "invalid-photo-format", "The Photo has an invalid format! Expected ${ImageFormat.YUV_420_888}, actual: $format")
class VideoEncoderError(message: String, cause: Throwable? = null) : CameraError("capture", "encoder-error", message, cause)
class VideoMuxerError(message: String, cause: Throwable? = null) : CameraError("capture", "muxer-error", message, cause)
class RecordingInProgressError(message: String, cause: Throwable? = null) : CameraError("capture", "recording-in-progress", message, cause)
class FileIOError(message: String, cause: Throwable? = null) : CameraError("capture", "file-io-error", message, cause)
class InvalidCameraError(message: String, cause: Throwable? = null) : CameraError("capture", "not-bound-error", message, cause)

class CameraManagerUnavailableError : CameraError("system", "no-camera-manager", "The Camera manager instance was unavailable for the current Application!")
class ViewNotFoundError(viewId: Int) : CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")

class UnknownCameraError(cause: Throwable) : CameraError("unknown", "unknown", cause.message ?: "An unknown camera error occured.", cause)
