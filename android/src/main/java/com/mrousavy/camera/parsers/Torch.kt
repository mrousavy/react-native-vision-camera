package com.mrousavy.camera.parsers

enum class Torch(override val unionValue: String): JSUnionValue {
  OFF("off"),
  ON("on");

  companion object: JSUnionValue.Companion<Torch> {
    override fun fromUnionValue(unionValue: String?): Torch {
      return when (unionValue) {
        "off" -> OFF
        "on" -> ON
        else -> OFF
      }
    }
  }
}
