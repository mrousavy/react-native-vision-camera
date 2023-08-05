package com.mrousavy.camera.parsers

enum class Flash(override val unionValue: String): JSUnionValue {
  OFF("off"),
  ON("on"),
  AUTO("auto");

  companion object: JSUnionValue.Companion<Flash> {
    override fun fromUnionValue(unionValue: String?): Flash {
      return when (unionValue) {
        "off" -> OFF
        "on" -> ON
        "auto" -> AUTO
        else -> OFF
      }
    }
  }
}
