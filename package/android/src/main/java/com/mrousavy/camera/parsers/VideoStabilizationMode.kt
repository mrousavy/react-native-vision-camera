package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_OFF
import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_ON
import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION
import android.hardware.camera2.CameraMetadata.LENS_OPTICAL_STABILIZATION_MODE_OFF
import android.hardware.camera2.CameraMetadata.LENS_OPTICAL_STABILIZATION_MODE_ON

enum class VideoStabilizationMode(override val unionValue: String): JSUnionValue {
  OFF("off"),
  STANDARD("standard"),
  CINEMATIC("cinematic"),
  CINEMATIC_EXTENDED("cinematic-extended");

  fun toDigitalStabilizationMode(): Int {
    return when (this) {
      OFF -> CONTROL_VIDEO_STABILIZATION_MODE_OFF
      STANDARD -> CONTROL_VIDEO_STABILIZATION_MODE_ON
      CINEMATIC -> 2 /* CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION */
      else -> CONTROL_VIDEO_STABILIZATION_MODE_OFF
    }
  }

  fun toOpticalStabilizationMode(): Int {
    return when (this) {
      OFF -> LENS_OPTICAL_STABILIZATION_MODE_OFF
      CINEMATIC_EXTENDED -> LENS_OPTICAL_STABILIZATION_MODE_ON
      else -> LENS_OPTICAL_STABILIZATION_MODE_OFF
    }
  }

  companion object: JSUnionValue.Companion<VideoStabilizationMode> {
    override fun fromUnionValue(unionValue: String?): VideoStabilizationMode? {
      return when (unionValue) {
        "off" -> OFF
        "standard" -> STANDARD
        "cinematic" -> CINEMATIC
        "cinematic-extended" -> CINEMATIC_EXTENDED
        else -> null
      }
    }

    fun fromDigitalVideoStabilizationMode(stabiliazionMode: Int): VideoStabilizationMode {
      return when (stabiliazionMode) {
        CONTROL_VIDEO_STABILIZATION_MODE_OFF -> OFF
        CONTROL_VIDEO_STABILIZATION_MODE_ON -> STANDARD
        CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION -> CINEMATIC
        else -> OFF
      }
    }
    fun fromOpticalVideoStabilizationMode(stabiliazionMode: Int): VideoStabilizationMode {
      return when (stabiliazionMode) {
        LENS_OPTICAL_STABILIZATION_MODE_OFF -> OFF
        LENS_OPTICAL_STABILIZATION_MODE_ON -> CINEMATIC_EXTENDED
        else -> OFF
      }
    }
  }
}
