package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.media.ImageReader
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getStreamSizes(): Array<Size> {
  val streams =
    this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      ?: return emptyArray()
  val sizes = streams.getOutputSizes(ImageReader::class.java)
  return sizes.distinct().toTypedArray()
}
