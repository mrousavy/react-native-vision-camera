package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraMetadata.*
import android.os.Build

data class VideoStabilizationMode(val digitalMode: Int,
                                  val opticalMode: Int)

fun parseDigitalVideoStabilizationMode(stabiliazionMode: Int): String {
  return when (stabiliazionMode) {
    CONTROL_VIDEO_STABILIZATION_MODE_OFF -> "off"
    CONTROL_VIDEO_STABILIZATION_MODE_ON -> "standard"
    CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION -> "cinematic"
    else -> "off"
  }
}
fun parseOpticalVideoStabilizationMode(stabiliazionMode: Int): String {
  return when (stabiliazionMode) {
    LENS_OPTICAL_STABILIZATION_MODE_OFF -> "off"
    LENS_OPTICAL_STABILIZATION_MODE_ON -> "cinematic-extended"
    else -> "off"
  }
}

fun getVideoStabilizationMode(stabiliazionMode: String): VideoStabilizationMode {
  return when (stabiliazionMode) {
    "off" -> VideoStabilizationMode(CONTROL_VIDEO_STABILIZATION_MODE_OFF, LENS_OPTICAL_STABILIZATION_MODE_OFF)
    "standard" -> VideoStabilizationMode(CONTROL_VIDEO_STABILIZATION_MODE_ON, LENS_OPTICAL_STABILIZATION_MODE_OFF)
    "cinematic" -> VideoStabilizationMode(2 /* CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION */, LENS_OPTICAL_STABILIZATION_MODE_OFF)
    "cinematic-extended" -> VideoStabilizationMode(CONTROL_VIDEO_STABILIZATION_MODE_OFF, LENS_OPTICAL_STABILIZATION_MODE_ON)
    else -> VideoStabilizationMode(CONTROL_VIDEO_STABILIZATION_MODE_OFF, LENS_OPTICAL_STABILIZATION_MODE_OFF)
  }
}
