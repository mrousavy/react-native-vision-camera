package com.mrousavy.camera.core

import com.mrousavy.camera.types.CameraDeviceError
import com.mrousavy.camera.types.VideoStabilizationMode

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

class MicrophonePermissionError :
  CameraError(
    "permission",
    "microphone-permission-denied",
    "The Microphone permission was denied! If you want to record Video without sound, pass `audio={false}`."
  )
class CameraPermissionError : CameraError("permission", "camera-permission-denied", "The Camera permission was denied!")

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
class LowLightBoostNotSupportedError :
  CameraError(
    "device",
    "low-light-boost-not-supported",
    "The currently selected camera device does not support low-light boost! Select a device where `device.supportsLowLightBoost` is true."
  )
class FlashUnavailableError :
  CameraError(
    "device",
    "flash-unavailable",
    "The Camera Device does not have a flash unit! Make sure you select a device where `device.hasFlash`/`device.hasTorch` is true."
  )
class FocusNotSupportedError :
  CameraError("device", "focus-not-supported", "The currently selected camera device does not support focusing!")

class CameraNotReadyError :
  CameraError("session", "camera-not-ready", "The Camera is not ready yet! Wait for the onInitialized() callback!")
class CameraCannotBeOpenedError(cameraId: String, error: CameraDeviceError) :
  CameraError("session", "camera-cannot-be-opened", "The given Camera device (id: $cameraId) could not be opened! Error: $error")
class CameraSessionCannotBeConfiguredError(cameraId: String) :
  CameraError("session", "cannot-create-session", "Failed to create a Camera Session for Camera #$cameraId!")
class CameraDisconnectedError(cameraId: String, error: CameraDeviceError) :
  CameraError("session", "camera-has-been-disconnected", "The given Camera device (id: $cameraId) has been disconnected! Error: $error")
class NoOutputsError :
  CameraError("session", "no-outputs", "Cannot create a CameraCaptureSession without any outputs! (PREVIEW, PHOTO, VIDEO, ...)")

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

class VideoNotEnabledError :
  CameraError("capture", "video-not-enabled", "Video capture is disabled! Pass `video={true}` to enable video recordings.")
class PhotoNotEnabledError :
  CameraError("capture", "photo-not-enabled", "Photo capture is disabled! Pass `photo={true}` to enable photo capture.")
class CaptureAbortedError(wasImageCaptured: Boolean) :
  CameraError("capture", "aborted", "The image capture was aborted! Was Image captured: $wasImageCaptured")
class FocusCanceledError : CameraError("capture", "focus-canceled", "The focus operation was canceled.")
class CaptureTimedOutError : CameraError("capture", "timed-out", "The image capture was aborted because it timed out.")
class UnknownCaptureError(wasImageCaptured: Boolean) :
  CameraError("capture", "unknown", "An unknown error occurred while trying to capture an Image! Was Image captured: $wasImageCaptured")
class RecorderError(name: String, extra: Int) :
  CameraError("capture", "recorder-error", "An error occured while recording a video! $name $extra")
class NoRecordingInProgressError :
  CameraError("capture", "no-recording-in-progress", "There was no active video recording in progress! Did you call stopRecording() twice?")
class InsufficientStorageError : CameraError("capture", "insufficient-storage", "There is not enough storage space available.")
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

class CodeTypeNotSupportedError(codeType: String) :
  CameraError(
    "code-scanner",
    "code-type-not-supported",
    "The codeType \"$codeType\" is not supported by the Code Scanner!"
  )
class CodeScannerTooManyOutputsError :
  CameraError(
    "code-scanner",
    "not-compatible-with-outputs",
    "CodeScanner can only be enabled when both video and frameProcessor are disabled! " +
      "Use a Frame Processor Plugin for code scanning instead."
  )

class ViewNotFoundError(viewId: Int) :
  CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")
class HardwareBuffersNotAvailableError :
  CameraError("system", "hardware-buffers-unavailable", "HardwareBuffers are only available on API 28 or higher!")

class UnknownCameraError(cause: Throwable?) : CameraError("unknown", "unknown", cause?.message ?: "An unknown camera error occured.", cause)
