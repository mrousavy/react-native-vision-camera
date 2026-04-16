package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import com.margelo.nitro.camera.utils.ImageFormatUtils

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getPhotoSizes(): Array<Size> {
  val streams =
    this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      ?: return emptyArray()
  val photoFormats = streams.outputFormats.filter { ImageFormatUtils.isPhotoFormat(it) }
  val sizes = photoFormats.flatMap { streams.getOutputSizes(it).toList() }
  val highResSizes = photoFormats.flatMap { streams.getHighResolutionOutputSizes(it).toList() }
  val combined = (sizes + highResSizes).distinct()
  return combined.toTypedArray()
}
