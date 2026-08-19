package com.margelo.nitro.camera.extensions

import android.graphics.ImageFormat
import androidx.camera.core.CameraInfo

fun CameraInfo.getOutputFormats(): IntArray {
  val cameraCharacteristics = cameraCharacteristicsOrNull
  return cameraCharacteristics?.getOutputImageFormats() ?: intArrayOf(ImageFormat.PRIVATE)
}
