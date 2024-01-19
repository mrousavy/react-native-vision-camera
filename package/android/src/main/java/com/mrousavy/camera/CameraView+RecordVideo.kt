package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.MicrophonePermissionError
import com.mrousavy.camera.core.RecordingSession
import com.mrousavy.camera.core.code
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.utils.makeErrorMap
import java.util.*

suspend fun CameraView.startRecording(options: RecordVideoOptions, onRecordCallback: Callback) {
  // check audio permission
  if (audio == true) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  val callback = { video: RecordingSession.Video ->
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
  cameraSession.startRecording(audio == true, options, callback, onError)
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
}
