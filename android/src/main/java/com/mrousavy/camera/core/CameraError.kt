package com.mrousavy.camera.core

import com.mrousavy.camera.core.types.VideoStabilizationMode

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
  override val message: String,
  /**
   * A throwable that caused this error.
   */
  cause: Throwable? = null
) : Throwable("[$domain/$id] $message", cause) {
  val code: String
    get() = "$domain/$id"
}

class CameraPermissionError : CameraError("permission", "camera-permission-denied", "The Camera permission was denied!")
class MicrophonePermissionError :
  CameraError(
    "permission",
    "microphone-permission-denied",
    "The Microphone permission was denied! If you want to record Video without sound, pass `audio={false}`."
  )
class LocationPermissionError :
  CameraError(
    "permission",
    "location-permission-denied",
    "The Location permission was denied! If you want to capture photos or videos without location tags, pass `enableLocation={false}`."
  )

class InvalidTypeScriptUnionError(unionName: String, unionValue: String?) :
  CameraError("parameter", "invalid-parameter", "The given value for $unionName could not be parsed! (Received: $unionValue)")

class NoCameraDeviceError :
  CameraError(
    "device",
    "no-device",
    "No device was set! Use `useCameraDevice(..)` or `Camera.getAvailableCameraDevices()` to select a suitable Camera device."
  )
class PixelFormatNotSupportedError(format: String) :
  CameraError("device", "pixel-format-not-supported", "The pixelFormat $format is not supported on the given Camera Device!")
class FlashUnavailableError :
  CameraError(
    "device",
    "flash-not-available",
    "The Camera Device does not have a flash unit! Make sure you select a device where `device.hasFlash`/`device.hasTorch` is true."
  )
class FocusNotSupportedError :
  CameraError("device", "focus-not-supported", "The currently selected camera device does not support focusing!")
class CameraInUseError(cause: Throwable?) :
  CameraError("device", "camera-already-in-use", "The given Camera Device is already in use!", cause)
class FatalCameraError(cause: Throwable?) :
  CameraError("device", "fatal-error", "An unknown fatal error occurred in the Camera HAL! Try restarting the phone.", cause)

class CameraNotReadyError :
  CameraError("session", "camera-not-ready", "The Camera is not ready yet! Wait for the onInitialized() callback!")
class NoOutputsError :
  CameraError("session", "no-outputs", "Cannot create a CameraCaptureSession without any outputs! (PREVIEW, PHOTO, VIDEO, ...)")
class RecoverableError(cause: Throwable?) :
  CameraError(
    "session",
    "recoverable-error",
    "An unknown error occurred while creating the Camera Session, but the Camera can recover from it.",
    cause
  )
class InvalidOutputConfigurationError(cause: Throwable?) :
  CameraError(
    "session",
    "invalid-output-configuration",
    "Failed to configure the Camera Session because the output/stream configurations are invalid!",
    cause
  )

class PropRequiresFormatToBeNonNullError(propName: String) :
  CameraError("format", "format-required", "The prop \"$propName\" requires a format to be set, but format was null!")
class InvalidFpsError(fps: Int) :
  CameraError(
    "format",
    "invalid-fps",
    "The given format cannot run at $fps FPS! Make sure your FPS is lower than `format.maxFps` but higher than `format.minFps`."
  )
class InvalidVideoStabilizationMode(mode: VideoStabilizationMode) :
  CameraError(
    "format",
    "invalid-video-stabilization-mode",
    "The given format does not support the videoStabilizationMode \"${mode.unionValue}\"! " +
      "Select a format that contains ${mode.unionValue} in `format.supportedVideoStabilizationModes`."
  )
class InvalidVideoHdrError :
  CameraError(
    "format",
    "invalid-video-hdr",
    "The given format does not support videoHdr! Select a format where `format.supportsVideoHdr` is true."
  )
class PhotoHdrAndVideoHdrNotSupportedSimultaneously :
  CameraError(
    "format",
    "photo-hdr-and-video-hdr-not-suppoted-simultaneously",
    "Photo HDR and Video HDR are not supported simultaneously! Disable either `videoHdr` or `photoHdr`."
  )
class LowLightBoostNotSupportedWithHdr :
  CameraError(
    "format",
    "low-light-boost-not-supported-with-hdr",
    "The low light boost extension does not work when HDR is enabled! Disable either `lowLightBoost` or `videoHdr`/`photoHdr`."
  )

class VideoNotEnabledError :
  CameraError("capture", "video-not-enabled", "Video capture is disabled! Pass `video={true}` to enable video recordings.")
class PhotoNotEnabledError :
  CameraError("capture", "photo-not-enabled", "Photo capture is disabled! Pass `photo={true}` to enable photo capture.")
class SnapshotFailedError :
  CameraError("capture", "snapshot-failed", "Failed to take a Snapshot of the Preview View! Try using takePhoto() instead.")
class SnapshotFailedPreviewNotEnabledError :
  CameraError(
    "capture",
    "snapshot-failed-preview-not-enabled",
    "Failed to take a Snapshot because preview={...} was disabled! " +
      "Enable preview and try again."
  )
class FocusCanceledError : CameraError("capture", "focus-canceled", "The focus operation has been canceled by a new focus request.")
class FocusRequiresPreviewError : CameraError("capture", "focus-requires-preview", "Focus requires preview={...} to be enabled!")

private fun getVideoCapturedMessage(wasVideoCaptured: Boolean): String =
  if (wasVideoCaptured) {
    "The output file was generated, so the recording may be valid."
  } else {
    "The output file was generated but the recording will not be valid, so you should delete the file."
  }

open class RecorderError(id: String, message: String, val wasVideoRecorded: Boolean, cause: Throwable?) :
  CameraError("capture", id, message, cause)
class UnknownRecorderError(wasVideoRecorded: Boolean, cause: Throwable?) :
  RecorderError(
    "recorder-error",
    "An error occurred while recording a video! ${getVideoCapturedMessage(wasVideoRecorded)} ${cause?.message}",
    wasVideoRecorded,
    cause
  )
class EncoderError(cause: Throwable?) :
  RecorderError("encoder-error", "The Video Encoder encountered an error occurred while recording a video!", false, cause)
class NoDataError(cause: Throwable?) :
  RecorderError(
    "no-data",
    "The Video Recording failed because no data was received! (${cause?.message}) " +
      "Did you stop the recording before any Frames arrived?",
    false,
    cause
  )
class InvalidRecorderConfigurationError(cause: Throwable?) :
  RecorderError(
    "invalid-recorder-configuration",
    "The Video Recording failed because it was configured with invalid settings! ${cause?.message}",
    false,
    cause
  )
class FileSizeLimitReachedError(cause: Throwable?) :
  RecorderError(
    "file-size-limit-reached",
    "The Video Recording was stopped because the file size limit was reached. The output file may still be valid.",
    true,
    cause
  )
class DurationLimitReachedError(cause: Throwable?) :
  RecorderError(
    "duration-limit-reached",
    "The Video Recording was stopped because the duration limit was reached. The output file may still be valid.",
    true,
    cause
  )
class InsufficientStorageForRecorderError(cause: Throwable?) :
  RecorderError("insufficient-storage", "There is not enough storage space available for a Video Recording.", false, cause)
class NoRecordingInProgressError :
  CameraError("capture", "no-recording-in-progress", "There was no active video recording in progress! Did you call stopRecording() twice?")
class RecordingCanceledError : CameraError("capture", "recording-canceled", "The active recording was canceled.")
class FileIOError(throwable: Throwable) :
  CameraError("capture", "file-io-error", "An unexpected File IO error occurred! Error: ${throwable.message}.", throwable)
class InvalidPathError(path: String) : CameraError("capture", "invalid-path", "The given path ($path) is invalid, or not writable!")
class RecordingInProgressError :
  CameraError(
    "capture",
    "recording-in-progress",
    "There is already an active video recording in progress! Did you call startRecording() twice?"
  )
class FrameInvalidError :
  CameraError(
    "capture",
    "frame-invalid",
    "Trying to access an already closed Frame! " +
      "Are you trying to access the Image data outside of a Frame Processor's lifetime?\n" +
      "- If you want to use `console.log(frame)`, use `console.log(frame.toString())` instead.\n" +
      "- If you want to do async processing, use `runAsync(...)` instead.\n" +
      "- If you want to use runOnJS, increment it's ref-count: `frame.incrementRefCount()`"
  )
class InvalidImageTypeError : CameraError("capture", "invalid-image-type", "Captured an Image with an invalid Image type!")

class CodeTypeNotSupportedError(codeType: String) :
  CameraError(
    "code-scanner",
    "code-type-not-supported",
    "The codeType \"$codeType\" is not supported by the Code Scanner!"
  )

class ViewNotFoundError(viewId: Int) :
  CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")
class HardwareBuffersNotAvailableError :
  CameraError("system", "hardware-buffers-unavailable", "HardwareBuffers are only available on API 28 or higher!")
class MaxCamerasInUseError(cause: Throwable?) :
  CameraError("system", "max-cameras-in-use", "The maximum amount of Cameras available for simultaneous use has been reached!", cause)
class CameraIsRestrictedError(cause: Throwable?) :
  CameraError(
    "system",
    "camera-is-restricted",
    "Camera functionality is not available because it has been restricted by the operating system, possibly due to a device policy.",
    cause
  )
class DoNotDisturbBugError(cause: Throwable?) :
  CameraError(
    "system",
    "do-not-disturb-bug",
    "The Camera Device could not be opened because of a bug in Android 9 (API 28) when do-not-disturb mode is enabled! " +
      "Either update your Android version, or disable do-not-disturb.",
    cause
  )
class RecordingWhileFrameProcessingUnavailable :
  CameraError(
    "system",
    "recording-while-frame-processing-unavailable",
    "Video Recordings are not possible with a Frame Processor running, " +
      "because the device is running on API 22 or lower and ImageWriters are not available."
  )

class UnknownCameraError(cause: Throwable?) : CameraError("unknown", "unknown", cause?.message ?: "An unknown camera error occured.", cause)
