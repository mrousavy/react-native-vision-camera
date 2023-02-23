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
