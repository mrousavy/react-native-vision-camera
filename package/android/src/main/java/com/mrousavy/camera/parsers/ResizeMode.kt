package com.mrousavy.camera.parsers

enum class ResizeMode(override val unionValue: String): JSUnionValue {
  COVER("cover"),
  CONTAIN("contain");

  companion object: JSUnionValue.Companion<ResizeMode> {
    override fun fromUnionValue(unionValue: String?): ResizeMode {
      return when (unionValue) {
        "cover" -> COVER
        "contain" -> CONTAIN
        else -> COVER
      }
    }
  }
}
