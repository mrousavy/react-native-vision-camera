package com.mrousavy.camera.core.types

enum class AutoFocusSystem(override val unionValue: String) : JSUnionValue {
  CONTRAST_DETECTION("contrast-detection"),
  NONE("none");

  companion object : JSUnionValue.Companion<AutoFocusSystem> {
    override fun fromUnionValue(unionValue: String?): AutoFocusSystem =
      when (unionValue) {
        "contrast-detection" -> CONTRAST_DETECTION
        else -> NONE
      }
  }
}
