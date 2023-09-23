package com.mrousavy.camera.extensions

import android.content.res.Resources
import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import android.view.SurfaceHolder
import kotlin.math.abs

private fun getMaximumPreviewSize(): Size {
  // See https://developer.android.com/reference/android/hardware/camera2/params/StreamConfigurationMap
  // According to the Android Developer documentation, PREVIEW streams can have a resolution
  // of up to the phone's display's resolution, with a maximum of 1920x1080.
  val display1080p = Size(1920, 1080)
  val displaySize = Size(
    Resources.getSystem().displayMetrics.widthPixels,
    Resources.getSystem().displayMetrics.heightPixels
  )
  val isHighResScreen = displaySize.bigger >= display1080p.bigger || displaySize.smaller >= display1080p.smaller

  return if (isHighResScreen) display1080p else displaySize
}

fun CameraCharacteristics.getPreviewSizeFromAspectRatio(aspectRatio: Double): Size {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val maximumPreviewSize = getMaximumPreviewSize()
  val outputSizes = config.getOutputSizes(SurfaceHolder::class.java)
    .sortedByDescending { it.width * it.height }
    .sortedBy { abs(aspectRatio - (it.bigger.toDouble() / it.smaller)) }

  return outputSizes.first { it.bigger <= maximumPreviewSize.bigger && it.smaller <= maximumPreviewSize.smaller }
}

fun CameraCharacteristics.getAutomaticPreviewSize(): Size {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val maximumPreviewSize = getMaximumPreviewSize()
  val outputSizes = config.getOutputSizes(SurfaceHolder::class.java)
    .sortedByDescending { it.width * it.height }

  return outputSizes.first { it.bigger <= maximumPreviewSize.bigger && it.smaller <= maximumPreviewSize.smaller }
}

fun CameraCharacteristics.getPreviewTargetSize(aspectRatio: Double?): Size =
  if (aspectRatio != null) {
    getPreviewSizeFromAspectRatio(aspectRatio)
  } else {
    getAutomaticPreviewSize()
  }
