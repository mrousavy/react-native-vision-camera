package com.margelo.nitro.camera.extensions.converters

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalZeroShutterLag
import androidx.camera.core.ImageCapture
import com.margelo.nitro.camera.QualityPrioritization

@OptIn(ExperimentalZeroShutterLag::class)
@ImageCapture.CaptureMode
fun QualityPrioritization.toCaptureMode(): Int {
  return when (this) {
    QualityPrioritization.SPEED -> ImageCapture.CAPTURE_MODE_ZERO_SHUTTER_LAG
    QualityPrioritization.BALANCED -> ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY
    QualityPrioritization.QUALITY -> ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY
  }
}
