package com.mrousavy.camera.extensions

import android.content.res.Resources
import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import android.view.SurfaceHolder

fun getMaximumPreviewSize(): Size {
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

fun CameraCharacteristics.getPreviewTargetSize(targetSize: Size?): Size {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val maximumPreviewSize = getMaximumPreviewSize()
  val outputSizes = config.getOutputSizes(SurfaceHolder::class.java)
    .filter { it.bigger <= maximumPreviewSize.bigger && it.smaller <= maximumPreviewSize.smaller }

  return outputSizes.closestToOrMax(targetSize)
}
