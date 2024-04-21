package com.mrousavy.camera.core.types

enum class AutoFocusSystem(override val unionValue: String) : com.mrousavy.camera.core.types.JSUnionValue {
  PHASE_DETECTION("phase-detection"),
  CONTRAST_DETECTION("contrast-detection"),
  NONE("none");

  companion object : com.mrousavy.camera.core.types.JSUnionValue.Companion<com.mrousavy.camera.core.types.AutoFocusSystem> {
    override fun fromUnionValue(unionValue: String?): _root_ide_package_.com.mrousavy.camera.core.types.AutoFocusSystem =
      when (unionValue) {
        "contrast-detection" -> _root_ide_package_.com.mrousavy.camera.core.types.AutoFocusSystem.CONTRAST_DETECTION
        else -> _root_ide_package_.com.mrousavy.camera.core.types.AutoFocusSystem.NONE
      }
  }
}
