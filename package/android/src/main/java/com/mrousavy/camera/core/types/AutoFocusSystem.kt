package com.mrousavy.camera.core.types

enum class AutoFocusSystem(override val unionValue: String) : JSUnionValue {
  PHASE_DETECTION("phase-detection"),
  CONTRAST_DETECTION("contrast-detection"),
  NONE("none");

  companion object : JSUnionValue.Companion<AutoFocusSystem> {
    override fun fromUnionValue(unionValue: String?): AutoFocusSystem =
      when (unionValue) {
        "contrast-detection" -> AutoFocusSystem.CONTRAST_DETECTION
        else -> AutoFocusSystem.NONE
      }
  }
}
