package com.mrousavy.camera.extensions

import android.content.res.Resources
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.util.Log
import android.util.Size

private fun getMaximumPreviewSize(): Size {
  // See https://developer.android.com/reference/android/hardware/camera2/params/StreamConfigurationMap
  // According to the Android Developer documentation, PREVIEW streams can have a resolution
  // of up to the phone's display's resolution, with a maximum of 1920x1080.
  val display1080p = Size(1920, 1080)
  val displaySize = Size(Resources.getSystem().displayMetrics.widthPixels, Resources.getSystem().displayMetrics.heightPixels)
  val isHighResScreen = displaySize.bigger >= display1080p.bigger || displaySize.smaller >= display1080p.smaller
  Log.i("PreviewSize", "Phone has a ${displaySize.width} x ${displaySize.height} screen.")
  return if (isHighResScreen) display1080p else displaySize
}

/**
 * Gets the maximum Preview Resolution this device is capable of streaming at.
 *
 * [format] should either be [ImageFormat.PRIVATE] or [ImageFormat.YUV_420_888].
 */
fun CameraCharacteristics.getPreviewSize(format: Int): Size {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val previewSize = getMaximumPreviewSize()
  val outputSizes = config.getOutputSizes(format).sortedByDescending { it.width * it.height }
  return outputSizes.first { it.bigger <= previewSize.bigger && it.smaller <= previewSize.smaller }
}
