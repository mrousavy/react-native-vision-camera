package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import com.margelo.nitro.camera.utils.ImageFormatUtils

fun CameraCharacteristics.getVideoSizes(): Array<Size> {
  val streams =
    this[CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP]
      ?: return emptyArray()
  val videoFormats = streams.outputFormats.filter { ImageFormatUtils.isVideoFormat(it) }
  val sizes = videoFormats.flatMap { streams.getOutputSizes(it).toListOrEmpty() }
  return sizes.distinct().toTypedArray()
}
