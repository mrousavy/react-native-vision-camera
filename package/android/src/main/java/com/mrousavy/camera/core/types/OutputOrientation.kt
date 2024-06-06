package com.mrousavy.camera.core.types

enum class OutputOrientation(override val unionValue: String) : JSUnionValue {
  DEVICE("device"),
  PREVIEW("preview"),
  PORTRAIT("portrait"),
  LANDSCAPE_RIGHT("landscape-right"),
  PORTRAIT_UPSIDE_DOWN("portrait-upside-down"),
  LANDSCAPE_LEFT("landscape-left");

  val lockedOrientation: Orientation?
    get() {
      return when (this) {
        PORTRAIT -> Orientation.PORTRAIT
        LANDSCAPE_LEFT -> Orientation.LANDSCAPE_LEFT
        PORTRAIT_UPSIDE_DOWN -> Orientation.PORTRAIT_UPSIDE_DOWN
        LANDSCAPE_LEFT -> Orientation.LANDSCAPE_LEFT
        else -> null
      }
    }

  companion object : JSUnionValue.Companion<OutputOrientation> {
    override fun fromUnionValue(unionValue: String?): OutputOrientation =
      when (unionValue) {
        "device" -> DEVICE
        "preview" -> PREVIEW
        "portrait" -> PORTRAIT
        "landscape-right" -> LANDSCAPE_RIGHT
        "portrait-upside-down" -> PORTRAIT_UPSIDE_DOWN
        "landscape-left" -> LANDSCAPE_LEFT
        else -> PORTRAIT
      }
  }
}
