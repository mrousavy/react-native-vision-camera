package com.mrousavy.camera.core.types

enum class Torch(override val unionValue: String) : JSUnionValue {
  OFF("off"),
  ON("on");

  companion object : JSUnionValue.Companion<Torch> {
    override fun fromUnionValue(unionValue: String?): Torch =
      when (unionValue) {
        "off" -> OFF
        "on" -> ON
        else -> OFF
      }
  }
}
