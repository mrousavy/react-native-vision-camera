package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.media.ImageReader
import android.util.Size

fun CameraCharacteristics.getStreamSizes(): Array<Size> {
  val streams =
    this[CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP]
      ?: return emptyArray()
  val sizes = streams.getOutputSizes(ImageReader::class.java).toListOrEmpty()
  return sizes.distinct().toTypedArray()
}
