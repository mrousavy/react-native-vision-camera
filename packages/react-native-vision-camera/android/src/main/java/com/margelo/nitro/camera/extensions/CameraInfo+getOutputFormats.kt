package com.margelo.nitro.camera.extensions

import android.graphics.ImageFormat
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.CameraInfo

@OptIn(ExperimentalCamera2Interop::class)
fun CameraInfo.getOutputFormats(): IntArray {
  try {
    val camera2Info = Camera2CameraInfo.from(this)
    return camera2Info.getOutputImageFormats()
  } catch (_: Throwable) {
    return intArrayOf(ImageFormat.PRIVATE)
  }
}
