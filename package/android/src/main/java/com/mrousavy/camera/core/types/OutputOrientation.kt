package com.mrousavy.camera.core.types

enum class OutputOrientation(override val unionValue: String) : JSUnionValue {
  DEVICE("device"),
  LANDSCAPE_LEFT("landscape-left");
  LANDSCAPE_RIGHT("landscape-right"),
  PORTRAIT("portrait"),
  PORTRAIT_UPSIDE_DOWN("portrait-upside-down"),
  PREVIEW("preview"),

  val lockedOrientation: Orientation?
    get() {
      return when (this) {
        LANDSCAPE_LEFT -> Orientation.LANDSCAPE_LEFT
        LANDSCAPE_RIGHT -> Orientation.LANDSCAPE_RIGHT
        PORTRAIT -> Orientation.PORTRAIT
        PORTRAIT_UPSIDE_DOWN -> Orientation.PORTRAIT_UPSIDE_DOWN
        else -> null
      }
    }

  companion object : JSUnionValue.Companion<OutputOrientation> {
    override fun fromUnionValue(unionValue: String?): OutputOrientation =
      when (unionValue) {
        "device" -> DEVICE
        "landscape-left" -> LANDSCAPE_LEFT
        "landscape-right" -> LANDSCAPE_RIGHT
        "portrait" -> PORTRAIT
        "portrait-upside-down" -> PORTRAIT_UPSIDE_DOWN
        "preview" -> PREVIEW
        else -> PORTRAIT
      }
  }
}
