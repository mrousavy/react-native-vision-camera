package com.mrousavy.camera.core.types

import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class CoordinateSystem(override val unionValue: String) : JSUnionValue {
  PREVIEW_VIEW("preview-view"),
  CAMERA("camera");

  companion object : JSUnionValue.Companion<CoordinateSystem> {
    override fun fromUnionValue(unionValue: String?): CoordinateSystem =
      when (unionValue) {
        "preview-view" -> PREVIEW_VIEW
        "camera" -> CAMERA
        else -> throw InvalidTypeScriptUnionError("coordinateSystem", unionValue)
      }
  }
}
