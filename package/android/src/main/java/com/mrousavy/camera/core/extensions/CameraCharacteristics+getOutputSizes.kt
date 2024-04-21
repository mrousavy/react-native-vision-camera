package com.mrousavy.camera.core.extensions

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.params.StreamConfigurationMap
import android.os.Build
import android.util.Size
import com.mrousavy.camera.core.utils.CamcorderProfileUtils

private fun getHighResolutionOutputSizes(config: StreamConfigurationMap, format: Int): Array<Size> =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    config.getHighResolutionOutputSizes(format) ?: emptyArray()
  } else {
    emptyArray()
  }

fun CameraCharacteristics.getPhotoSizes(format: Int): List<Size> {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val sizes = config.getOutputSizes(format) ?: emptyArray()
  val highResSizes = getHighResolutionOutputSizes(config, format)
  return sizes.plus(highResSizes).toList()
}
