package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics

fun CameraCharacteristics.getSupportedApertures(): FloatArray {
  val apertures =
    this[CameraCharacteristics.LENS_INFO_AVAILABLE_APERTURES]
      ?: return floatArrayOf()
  return apertures
}

fun CameraCharacteristics.getDefaultSimulatedAperture(): Double? {
  val apertures = getSupportedApertures()
  return apertures.firstOrNull()?.toDouble()
}
