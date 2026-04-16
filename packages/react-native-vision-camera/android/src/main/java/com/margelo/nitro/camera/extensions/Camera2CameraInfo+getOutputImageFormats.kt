package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getOutputImageFormats(): IntArray {
  val streamMap = this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
  if (streamMap == null) return intArrayOf()
  return streamMap.outputFormats
}
