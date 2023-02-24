package com.mrousavy.camera

import android.annotation.SuppressLint
import com.facebook.react.bridge.*
import java.util.*

data class TemporaryFile(val path: String)

fun CameraView.startRecording(options: ReadableMap, onRecordCallback: Callback) {
  throw NotImplementedError("TODO: startRecording()")
}

@SuppressLint("RestrictedApi")
fun CameraView.pauseRecording() {
  throw NotImplementedError("TODO: pauseRecording()")
}

@SuppressLint("RestrictedApi")
fun CameraView.resumeRecording() {
  throw NotImplementedError("TODO: resumeRecording()")
}

@SuppressLint("RestrictedApi")
fun CameraView.stopRecording() {
  throw NotImplementedError("TODO: stopRecording()")
}
