package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import com.facebook.react.bridge.*
import com.mrousavy.camera.utils.makeErrorMap
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

data class TemporaryFile(val path: String)

fun CameraView.startRecording(options: ReadableMap, onRecordCallback: Callback) {
  if (videoCapture == null) {
    if (video == true) {
      throw CameraNotReadyError()
    } else {
      throw VideoNotEnabledError()
    }
  }

  // check audio permission
  if (audio == true) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  if (options.hasKey("flash")) {
    val enableFlash = options.getString("flash") == "on"
    // overrides current torch mode value to enable flash while recording
    camera!!.cameraControl.enableTorch(enableFlash)
  }

  val id = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
  val file = File.createTempFile("VisionCamera-${id}", ".mp4")
  val fileOptions = FileOutputOptions.Builder(file).build()

  val recorder = videoCapture!!.output
  var recording = recorder.prepareRecording(context, fileOptions)

  if (audio == true) {
    @SuppressLint("MissingPermission")
    recording = recording.withAudioEnabled()
  }

  activeVideoRecording = recording.start(ContextCompat.getMainExecutor(context), object : Consumer<VideoRecordEvent> {
    override fun accept(event: VideoRecordEvent?) {
      if (event is VideoRecordEvent.Finalize) {
        if (event.hasError()) {
          // error occured!
          val error = when (event.error) {
            VideoRecordEvent.Finalize.ERROR_ENCODING_FAILED -> VideoEncoderError(event.cause)
            VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED -> FileSizeLimitReachedError(event.cause)
            VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE -> InsufficientStorageError(event.cause)
            VideoRecordEvent.Finalize.ERROR_INVALID_OUTPUT_OPTIONS -> InvalidVideoOutputOptionsError(event.cause)
            VideoRecordEvent.Finalize.ERROR_NO_VALID_DATA -> NoValidDataError(event.cause)
            VideoRecordEvent.Finalize.ERROR_RECORDER_ERROR -> RecorderError(event.cause)
            VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE -> InactiveSourceError(event.cause)
            else -> UnknownCameraError(event.cause)
          }
          val map = makeErrorMap("${error.domain}/${error.id}", error.message, error)
          onRecordCallback(null, map)
        } else {
          // recording saved successfully!
          val map = Arguments.createMap()
          map.putString("path", event.outputResults.outputUri.toString())
          map.putDouble("duration", /* seconds */ event.recordingStats.recordedDurationNanos.toDouble() / 1000000.0 / 1000.0)
          map.putDouble("size", /* kB */ event.recordingStats.numBytesRecorded.toDouble() / 1000.0)
          onRecordCallback(map, null)
        }

        // reset the torch mode
        camera!!.cameraControl.enableTorch(torch == "on")
      }
    }
  })
}

@SuppressLint("RestrictedApi")
fun CameraView.pauseRecording() {
  if (videoCapture == null) {
    throw CameraNotReadyError()
  }
  if (activeVideoRecording == null) {
    throw NoRecordingInProgressError()
  }

  activeVideoRecording!!.pause()
}

@SuppressLint("RestrictedApi")
fun CameraView.resumeRecording() {
  if (videoCapture == null) {
    throw CameraNotReadyError()
  }
  if (activeVideoRecording == null) {
    throw NoRecordingInProgressError()
  }

  activeVideoRecording!!.resume()
}

@SuppressLint("RestrictedApi")
fun CameraView.stopRecording() {
  if (videoCapture == null) {
    throw CameraNotReadyError()
  }
  if (activeVideoRecording == null) {
    throw NoRecordingInProgressError()
  }

  activeVideoRecording!!.stop()

  // reset torch mode to original value
  camera!!.cameraControl.enableTorch(torch == "on")
}
