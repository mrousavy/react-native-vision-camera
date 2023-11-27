package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.mrousavy.camera.core.MicrophonePermissionError
import com.mrousavy.camera.core.RecorderError
import com.mrousavy.camera.core.RecordingSession
import com.mrousavy.camera.core.code
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoCodec
import com.mrousavy.camera.types.VideoFileType
import com.mrousavy.camera.utils.makeErrorMap
import java.util.*

suspend fun CameraView.startRecording(options: ReadableMap, onRecordCallback: Callback) {
  // check audio permission
  if (audio == true) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  val enableFlash = options.getString("flash") == "on"
  if (enableFlash) {
    // overrides current torch mode value to enable flash while recording
    cameraSession.configure { config ->
      config.torch = Torch.ON
    }
  }
  var codec = VideoCodec.H264
  if (options.hasKey("videoCodec")) {
    codec = VideoCodec.fromUnionValue(options.getString("videoCodec"))
  }
  var fileType = VideoFileType.MP4
  if (options.hasKey("fileType")) {
    fileType = VideoFileType.fromUnionValue(options.getString("fileType"))
  }
  var bitRate: Double? = null
  if (options.hasKey("videoBitRateOverride")) {
    bitRate = options.getDouble("videoBitRateOverride")
  }
  var bitRateMultiplier: Double? = null
  if (options.hasKey("videoBitRateMultiplier")) {
    bitRateMultiplier = options.getDouble("videoBitRateMultiplier")
  }

  val callback = { video: RecordingSession.Video ->
    val map = Arguments.createMap()
    map.putString("path", video.path)
    map.putDouble("duration", video.durationMs.toDouble() / 1000.0)
    onRecordCallback(map, null)
  }
  val onError = { error: RecorderError ->
    val errorMap = makeErrorMap(error.code, error.message)
    onRecordCallback(null, errorMap)
  }
  cameraSession.startRecording(audio == true, codec, fileType, bitRate, callback, onError)
}

@SuppressLint("RestrictedApi")
suspend fun CameraView.pauseRecording() {
  cameraSession.pauseRecording()
}

@SuppressLint("RestrictedApi")
suspend fun CameraView.resumeRecording() {
  cameraSession.resumeRecording()
}

@SuppressLint("RestrictedApi")
suspend fun CameraView.stopRecording() {
  cameraSession.stopRecording()
  // Set torch back to it's original value in case we just used it as a flash for the recording.
  cameraSession.configure { config ->
    config.torch = torch
  }
}
