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
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.utils.makeErrorMap
import java.util.*

suspend fun CameraView.startRecording(options: RecordVideoOptions, onRecordCallback: Callback) {
  // check audio permission
  if (audio == true) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  val enableFlash = options.flash == Flash.ON
  if (enableFlash) {
    // overrides current torch mode value to enable flash while recording
    cameraSession.configure { config ->
      config.torch = Torch.ON
    }
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
  // Set torch back to it's original value in case we just used it as a flash for the recording.
  cameraSession.configure { config ->
    config.torch = torch
  }
}
