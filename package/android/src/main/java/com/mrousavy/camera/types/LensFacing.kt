package com.mrousavy.camera.types

import android.hardware.camera2.CameraCharacteristics

enum class LensFacing(override val unionValue: String) : JSUnionValue {
  BACK("back"),
  FRONT("front"),
  EXTERNAL("external");

  companion object {
    fun fromCameraCharacteristics(cameraCharacteristics: CameraCharacteristics): LensFacing =
      when (cameraCharacteristics.get(CameraCharacteristics.LENS_FACING)!!) {
        CameraCharacteristics.LENS_FACING_BACK -> BACK
        CameraCharacteristics.LENS_FACING_FRONT -> FRONT
        CameraCharacteristics.LENS_FACING_EXTERNAL -> EXTERNAL
        else -> EXTERNAL
      }
  }
}
