package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics

/**
 * Parses Lens Facing int to a string representation useable for the TypeScript types.
 */
fun parseLensFacing(lensFacing: Int?): String? {
  return when (lensFacing) {
    CameraCharacteristics.LENS_FACING_BACK -> "back"
    CameraCharacteristics.LENS_FACING_FRONT -> "front"
    CameraCharacteristics.LENS_FACING_EXTERNAL -> "external"
    else -> null
  }
}
