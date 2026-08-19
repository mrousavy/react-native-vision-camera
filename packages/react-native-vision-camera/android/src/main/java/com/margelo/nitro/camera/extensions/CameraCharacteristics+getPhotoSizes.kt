package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import com.margelo.nitro.camera.utils.ImageFormatUtils

fun CameraCharacteristics.getPhotoSizes(): Array<Size> {
  val streams =
    this[CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP]
      ?: return emptyArray()
  val photoFormats = streams.outputFormats.filter { ImageFormatUtils.isPhotoFormat(it) }
  val sizes = photoFormats.flatMap { streams.getOutputSizes(it).toListOrEmpty() }
  val highResSizes = photoFormats.flatMap { streams.getHighResolutionOutputSizes(it).toListOrEmpty() }
  val combined = (sizes + highResSizes).distinct()
  return combined.toTypedArray()
}
