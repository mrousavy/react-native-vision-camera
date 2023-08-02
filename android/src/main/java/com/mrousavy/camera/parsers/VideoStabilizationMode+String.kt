package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraMetadata.*

fun parseVideoStabilizationMode(stabiliazionMode: Int): String {
  return when (stabiliazionMode) {
    CONTROL_VIDEO_STABILIZATION_MODE_OFF -> "off"
    CONTROL_VIDEO_STABILIZATION_MODE_ON -> "standard"
    CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION -> "cinematic"
    else -> "off"
  }
}

fun getVideoStabilizationMode(stabiliazionMode: String): Int {
  return when (stabiliazionMode) {
    "off" -> CONTROL_VIDEO_STABILIZATION_MODE_OFF
    "standard" -> CONTROL_VIDEO_STABILIZATION_MODE_ON
    "cinematic" -> 2 /* TODO: CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION */
    else -> CONTROL_VIDEO_STABILIZATION_MODE_OFF
  }
}
