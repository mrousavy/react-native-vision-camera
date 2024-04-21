package com.mrousavy.camera.core.types

import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalLensFacing

enum class Position(override val unionValue: String) : JSUnionValue {
  BACK("back"),
  FRONT("front"),
  EXTERNAL("external");

  companion object {
    @OptIn(ExperimentalLensFacing::class)
    fun fromLensFacing(lensFacing: Int): Position =
      when (lensFacing) {
        CameraSelector.LENS_FACING_BACK -> BACK
        CameraSelector.LENS_FACING_FRONT -> FRONT
        CameraSelector.LENS_FACING_EXTERNAL -> EXTERNAL
        CameraSelector.LENS_FACING_UNKNOWN -> EXTERNAL
        else -> EXTERNAL
      }
  }
}
