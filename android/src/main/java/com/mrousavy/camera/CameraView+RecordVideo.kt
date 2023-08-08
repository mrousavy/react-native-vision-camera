package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessor.Frame
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

fun CameraView.startRecording(options: ReadableMap, onRecordCallback: Callback) {
  // check audio permission
  if (audio == true) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw MicrophonePermissionError()
    }
  }

  if (options.hasKey("flash")) {
    val enableFlash = options.getString("flash") == "on"
    // overrides current torch mode value to enable flash while recording
    // TODO: Enable torch for flash
  }

  val id = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
  val file = File.createTempFile("VisionCamera-${id}", ".mp4")

  // TODO: startRecording()
}

@SuppressLint("RestrictedApi")
fun CameraView.pauseRecording() {
  // TODO: pauseRecording()
}

@SuppressLint("RestrictedApi")
fun CameraView.resumeRecording() {
  // TODO: resumeRecording()
}

@SuppressLint("RestrictedApi")
fun CameraView.stopRecording() {
  // TODO: stopRecording()
  // TODO: disable torch again
}

fun CameraView.onFrame(frame: Frame) {
  frame.incrementRefCount()

  Log.d(CameraView.TAG, "New Frame available!")
  if (frameProcessor != null) {
    frameProcessor?.call(frame)
  }

  frame.decrementRefCount()
}
