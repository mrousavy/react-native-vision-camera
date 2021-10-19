package com.mrousavy.camera

import android.graphics.ImageFormat
import androidx.camera.video.VideoRecordEvent.Finalize.VideoRecordError

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

class VideoEncoderError(cause: Throwable?) : CameraError("capture", "encoder-error", "The recording failed while encoding.\n" +
  "This error may be generated when the video or audio codec encounters an error during encoding. " +
  "When this happens and the output file is generated, the output file is not properly constructed. " +
  "The application will need to clean up the output file, such as deleting the file.",
  cause)

class InvalidVideoOutputOptionsError(cause: Throwable?) : CameraError("capture", "invalid-video-options",
  "The recording failed due to invalid output options.\n" +
  "This error is generated when invalid output options have been used while preparing a recording",
  cause)

class RecorderError(cause: Throwable?) : CameraError("capture", "recorder-error",
  "The recording failed because the Recorder is in an unrecoverable error state.\n" +
  "When this happens and the output file is generated, the output file is not properly constructed. " +
  "The application will need to clean up the output file, such as deleting the file. " +
  "Such an error will usually require creating a new Recorder object to start a new recording.",
  cause)

class NoValidDataError(cause: Throwable?) : CameraError("capture", "no-valid-data",
  "The recording failed because no valid data was produced to be recorded.\n" +
  "This error is generated when the essential data for a recording to be played correctly is missing, for example, " +
  "a recording must contain at least one key frame. The application will need to clean up the output file, such as deleting the file.",
  cause)

class InactiveSourceError(cause: Throwable?) : CameraError("capture", "inactive-source",
  "The recording failed because the source becomes inactive and stops sending frames.\n" +
  "One case is that if camera is closed due to lifecycle stopped, the active recording will be finalized with this error, " +
  "and the output will be generated, containing the frames produced before camera closing. " +
  "Attempting to start a new recording will be finalized immediately if the source remains inactive and no output will be generated.",
  cause)

class InsufficientStorageError(cause: Throwable?) : CameraError("capture", "insufficient-storage",
  "The recording failed due to insufficient storage space.\n" +
  "There are two possible cases that will cause this error.\n" +
  "1. The storage is already full before the recording starts, so no output file will be generated.\n" +
  "2. The storage becomes full during recording, so the output file will be generated.",
  cause)

class FileSizeLimitReachedError(cause: Throwable?) : CameraError("capture", "file-size-limit-reached",
  "The recording failed due to file size limitation.\n" +
  "The file size limitation will refer to OutputOptions.getFileSizeLimit(). The output file will still be generated with this error.",
  cause)

class NoRecordingInProgressError : CameraError("capture", "no-recording-in-progress", "No active recording in progress!")

class CameraManagerUnavailableError : CameraError("system", "no-camera-manager", "The Camera manager instance was unavailable for the current Application!")
class ViewNotFoundError(viewId: Int) : CameraError("system", "view-not-found", "The given view (ID $viewId) was not found in the view manager.")

class UnknownCameraError(cause: Throwable?) : CameraError("unknown", "unknown", cause?.message ?: "An unknown camera error occured.", cause)
