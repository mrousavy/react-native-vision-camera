package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import com.mrousavy.camera.utils.CamcorderProfileUtils

fun CameraCharacteristics.getVideoSizes(cameraId: String, format: Int): List<Size> {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val sizes = config.getOutputSizes(format) ?: emptyArray()
  val maxVideoSize = CamcorderProfileUtils.getMaximumVideoSize(cameraId)
  if (maxVideoSize != null) {
    return sizes.filter { it.bigger <= maxVideoSize.bigger }
  }
  return sizes.toList()
}

fun CameraCharacteristics.getPhotoSizes(format: Int): List<Size> {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val sizes = config.getOutputSizes(format) ?: emptyArray()
  val highResSizes = config.getHighResolutionOutputSizes(format) ?: emptyArray()
  return sizes.plus(highResSizes).toList()
}
