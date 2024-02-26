package com.mrousavy.camera.types

import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_OFF
import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_ON
import android.hardware.camera2.CameraMetadata.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION
import android.hardware.camera2.CameraMetadata.LENS_OPTICAL_STABILIZATION_MODE_OFF
import android.hardware.camera2.CameraMetadata.LENS_OPTICAL_STABILIZATION_MODE_ON
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class VideoStabilizationMode(override val unionValue: String) : JSUnionValue {
  OFF("off"),
  STANDARD("standard"),
  CINEMATIC("cinematic"),
  CINEMATIC_EXTENDED("cinematic-extended");

  private val score: Int
    get() {
      return when (this) {
        OFF -> 0
        STANDARD -> 1
        CINEMATIC -> 2
        CINEMATIC_EXTENDED -> 3
      }
    }

  fun isAtLeast(mode: VideoStabilizationMode): Boolean {
    return score >= mode.score
  }

  companion object : JSUnionValue.Companion<VideoStabilizationMode> {
    override fun fromUnionValue(unionValue: String?): VideoStabilizationMode =
      when (unionValue) {
        "off" -> OFF
        "auto" -> OFF
        "standard" -> STANDARD
        "cinematic" -> CINEMATIC
        "cinematic-extended" -> CINEMATIC_EXTENDED
        else -> throw InvalidTypeScriptUnionError("videoStabilizationMode", unionValue)
      }

    fun fromDigitalVideoStabilizationMode(stabiliazionMode: Int): VideoStabilizationMode =
      when (stabiliazionMode) {
        CONTROL_VIDEO_STABILIZATION_MODE_OFF -> OFF
        CONTROL_VIDEO_STABILIZATION_MODE_ON -> STANDARD
        CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION -> CINEMATIC
        else -> OFF
      }
    fun fromOpticalVideoStabilizationMode(stabiliazionMode: Int): VideoStabilizationMode =
      when (stabiliazionMode) {
        LENS_OPTICAL_STABILIZATION_MODE_OFF -> OFF
        LENS_OPTICAL_STABILIZATION_MODE_ON -> CINEMATIC_EXTENDED
        else -> OFF
      }
  }
}
