package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import com.margelo.nitro.camera.Range

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getSupportedApertures(): FloatArray {
  val apertures =
    getCameraCharacteristic(CameraCharacteristics.LENS_INFO_AVAILABLE_APERTURES)
      ?: return floatArrayOf()
  return apertures
}

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getDefaultSimulatedAperture(): Double? {
  val apertures = getSupportedApertures()
  return apertures.firstOrNull()?.toDouble()
}
