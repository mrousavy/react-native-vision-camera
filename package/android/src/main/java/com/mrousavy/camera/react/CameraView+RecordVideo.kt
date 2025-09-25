package com.mrousavy.camera.react

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.MicrophonePermissionError
import com.mrousavy.camera.core.cancelRecording
import com.mrousavy.camera.core.pauseRecording
import com.mrousavy.camera.core.resumeRecording
import com.mrousavy.camera.core.startRecording
import com.mrousavy.camera.core.stopRecording
import com.mrousavy.camera.core.types.RecordVideoOptions
import com.mrousavy.camera.core.types.Video
import com.mrousavy.camera.react.utils.makeErrorMap

fun CameraView.startRecording(options: RecordVideoOptions, onRecordCallback: Callback) {
  // check audio permission
  if (audio) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  val callback = { video: Video ->
    val map = Arguments.createMap()
    map.putString("path", video.path)
    map.putDouble("duration", video.durationMs.toDouble() / 1000.0)
    map.putInt("width", video.size.width)
    map.putInt("height", video.size.height)
    onRecordCallback(map, null)
  }
  val onError = { error: CameraError ->
    val errorMap = makeErrorMap(error.code, error.message)
    onRecordCallback(null, errorMap)
  }
  cameraSession.startRecording(audio, options, callback, onError)
}

fun CameraView.pauseRecording() {
  cameraSession.pauseRecording()
}

fun CameraView.resumeRecording() {
  cameraSession.resumeRecording()
}

fun CameraView.stopRecording() {
  cameraSession.stopRecording()
}

fun CameraView.cancelRecording() {
  cameraSession.cancelRecording()
}
