package com.mrousavy.camera

import com.mrousavy.camera.core.outputs.CameraOutputs
import com.mrousavy.camera.parsers.CameraDeviceError

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

class InvalidTypeScriptUnionError(unionName: String, unionValue: String) :
  CameraError("parameter", "invalid-parameter", "The given value for $unionName could not be parsed! (Received: $unionValue)")

class NoCameraDeviceError :
  CameraError("device", "no-device", "No device was set! Use `getAvailableCameraDevices()` to select a suitable Camera device.")
class PixelFormatNotSupportedError(format: String) :
  CameraError("device", "pixel-format-not-supported", "The pixelFormat $format is not supported on the given Camera Device!")
class PixelFormatNotSupportedInVideoPipelineError(format: String) :
  CameraError(
    "device",
    "pixel-format-not-supported",
    "The pixelFormat $format is currently not supported in the VideoPipeline! " +
      "See this issue for more details ($4.000 bounty!): https://github.com/mrousavy/react-native-vision-camera/issues/1837"
  )

class CameraNotReadyError :
  CameraError("session", "camera-not-ready", "The Camera is not ready yet! Wait for the onInitialized() callback!")
class CameraCannotBeOpenedError(cameraId: String, error: CameraDeviceError) :
  CameraError("session", "camera-cannot-be-opened", "The given Camera device (id: $cameraId) could not be opened! Error: $error")
class CameraSessionCannotBeConfiguredError(cameraId: String, outputs: CameraOutputs) :
  CameraError("session", "cannot-create-session", "Failed to create a Camera Session for Camera $cameraId! Outputs: $outputs")
class CameraDisconnectedError(cameraId: String, error: CameraDeviceError) :
  CameraError("session", "camera-has-been-disconnected", "The given Camera device (id: $cameraId) has been disconnected! Error: $error")

class VideoNotEnabledError :
  CameraError("capture", "video-not-enabled", "Video capture is disabled! Pass `video={true}` to enable video recordings.")
class PhotoNotEnabledError :
  CameraError("capture", "photo-not-enabled", "Photo capture is disabled! Pass `photo={true}` to enable photo capture.")
class CaptureAbortedError(wasImageCaptured: Boolean) :
  CameraError("capture", "aborted", "The image capture was aborted! Was Image captured: $wasImageCaptured")
class UnknownCaptureError(wasImageCaptured: Boolean) :
  CameraError("capture", "unknown", "An unknown error occurred while trying to capture an Image! Was Image captured: $wasImageCaptured")

class RecorderError(name: String, extra: Int) :
  CameraError("capture", "recorder-error", "An error occured while recording a video! $name $extra")

class NoRecordingInProgressError :
  CameraError("capture", "no-recording-in-progress", "There was no active video recording in progress! Did you call stopRecording() twice?")
class RecordingInProgressError :
  CameraError(
    "capture",
    "recording-in-progress",
    "There is already an active video recording in progress! Did you call startRecording() twice?"
  )

class ViewNotFoundError(viewId: Int) :
  CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")

class UnknownCameraError(cause: Throwable?) : CameraError("unknown", "unknown", cause?.message ?: "An unknown camera error occured.", cause)
