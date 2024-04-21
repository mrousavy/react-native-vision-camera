package com.mrousavy.camera.core.types

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalZeroShutterLag
import androidx.camera.core.ImageCapture

enum class QualityBalance(override val unionValue: String) : JSUnionValue {
  SPEED("speed"),
  BALANCED("balanced"),
  QUALITY("quality");

  @OptIn(ExperimentalZeroShutterLag::class)
  fun toCaptureMode(): Int =
    when (this) {
      SPEED -> ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY
      BALANCED -> ImageCapture.CAPTURE_MODE_ZERO_SHUTTER_LAG
      QUALITY -> ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY
    }

  companion object : JSUnionValue.Companion<QualityBalance> {
    override fun fromUnionValue(unionValue: String?): QualityBalance =
      when (unionValue) {
        "speed" -> SPEED
        "balanced" -> BALANCED
        "quality" -> QUALITY
        else -> BALANCED
      }
  }
}
