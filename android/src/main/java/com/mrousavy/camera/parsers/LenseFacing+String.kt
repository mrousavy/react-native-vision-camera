package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics

fun parseLensFacing(lensFacing: Int?): String {
  return when (lensFacing) {
    CameraCharacteristics.LENS_FACING_BACK -> "back"
    CameraCharacteristics.LENS_FACING_FRONT -> "front"
    CameraCharacteristics.LENS_FACING_EXTERNAL -> "external"
    else -> throw Error("Invalid Lens Facing Int: $lensFacing")
  }
}
