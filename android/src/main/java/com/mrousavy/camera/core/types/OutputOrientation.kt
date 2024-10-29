package com.mrousavy.camera.core.types

enum class OutputOrientation(override val unionValue: String) : JSUnionValue {
  DEVICE("device"),
  PREVIEW("preview");

  companion object : JSUnionValue.Companion<OutputOrientation> {
    override fun fromUnionValue(unionValue: String?): OutputOrientation =
      when (unionValue) {
        "device" -> DEVICE
        "preview" -> PREVIEW
        else -> DEVICE
      }
  }
}
