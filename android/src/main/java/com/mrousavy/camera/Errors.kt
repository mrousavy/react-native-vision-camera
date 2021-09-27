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

class MicrophonePermissionError : CameraError("permission", "microphone-permission-denied", "The Microphone permission was denied! If you want to record Video without sound, pass `audio={false}`.")
class CameraPermissionError : CameraError("permission", "camera-permission-denied", "The Camera permission was denied!")

class InvalidTypeScriptUnionError(unionName: String, unionValue: String) : CameraError("parameter", "invalid-parameter", "The given value for $unionName could not be parsed! (Received: $unionValue)")

class NoCameraDeviceError : CameraError("device", "no-device", "No device was set! Use `getAvailableCameraDevices()` to select a suitable Camera device.")
class InvalidCameraDeviceError(cause: Throwable) : CameraError("device", "invalid-device", "The given Camera device could not be found for use-case binding!", cause)
class ParallelVideoProcessingNotSupportedError(cause: Throwable) : CameraError("device", "parallel-video-processing-not-supported", "The given LEGACY Camera device does not support parallel " +
  "video processing (`video={true}` + `frameProcessor={...}`). Disable either `video` or `frameProcessor`. To find out if a device supports parallel video processing, check the `supportsParallelVideoProcessing` property on the CameraDevice. " +
  "See https://mrousavy.github.io/react-native-vision-camera/docs/guides/devices#the-supportsparallelvideoprocessing-prop for more information.", cause)

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

class VideoNotEnabledError : CameraError("capture", "video-not-enabled", "Video capture is disabled! Pass `video={true}` to enable video recordings.")
class PhotoNotEnabledError : CameraError("capture", "photo-not-enabled", "Photo capture is disabled! Pass `photo={true}` to enable photo capture.")

class InvalidFormatError(format: Int) : CameraError("capture", "invalid-photo-format", "The Photo has an invalid format! Expected ${ImageFormat.YUV_420_888}, actual: $format")
class VideoEncoderError(message: String, cause: Throwable? = null) : CameraError("capture", "encoder-error", message, cause)
class VideoMuxerError(message: String, cause: Throwable? = null) : CameraError("capture", "muxer-error", message, cause)
class RecordingInProgressError(message: String, cause: Throwable? = null) : CameraError("capture", "recording-in-progress", message, cause)
class FileIOError(message: String, cause: Throwable? = null) : CameraError("capture", "file-io-error", message, cause)
class InvalidCameraError(message: String, cause: Throwable? = null) : CameraError("capture", "not-bound-error", message, cause)

class CameraManagerUnavailableError : CameraError("system", "no-camera-manager", "The Camera manager instance was unavailable for the current Application!")
class ViewNotFoundError(viewId: Int) : CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")

class UnknownCameraError(cause: Throwable) : CameraError("unknown", "unknown", cause.message ?: "An unknown camera error occured.", cause)
