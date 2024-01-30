package com.mrousavy.camera.types

enum class AutoFocusSystem(override val unionValue: String) : JSUnionValue {
  PHASE_DETECTION("phase-detection"),
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
