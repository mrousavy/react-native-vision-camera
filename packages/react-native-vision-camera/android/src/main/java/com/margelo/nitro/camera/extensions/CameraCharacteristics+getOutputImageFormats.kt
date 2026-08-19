package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics

fun CameraCharacteristics.getOutputImageFormats(): IntArray {
  val streamMap = this[CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP]
  if (streamMap == null) return intArrayOf()
  return streamMap.outputFormats
}
