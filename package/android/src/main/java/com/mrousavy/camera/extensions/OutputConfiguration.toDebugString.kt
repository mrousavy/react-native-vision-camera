package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.params.OutputConfiguration
import android.os.Build

val OutputConfiguration.streamUseCaseString: String
  get () {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return "UNKNOWN"
    return when (streamUseCase.toInt()) {
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_DEFAULT -> "DEFAULT"
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW -> "PREVIEW"
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW_VIDEO_STILL -> "PREVIEW_VIDEO_STILL"
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_STILL_CAPTURE -> "STILL_CAPTURE"
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_CALL -> "VIDEO_CALL"
      CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_RECORD -> "VIDEO_RECORD"
      else -> "UNKNOWN"
    }
  }

fun OutputConfiguration.toDebugString(): String {
  return "$streamUseCaseString Output (Surface: $surface)"
}
