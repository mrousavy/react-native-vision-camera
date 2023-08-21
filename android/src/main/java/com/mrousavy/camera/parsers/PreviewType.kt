package com.mrousavy.camera.parsers

enum class PreviewType(override val unionValue: String): JSUnionValue {
  NONE("none"),
  NATIVE("native"),
  SKIA("skia");

  companion object: JSUnionValue.Companion<PreviewType> {
    override fun fromUnionValue(unionValue: String?): PreviewType {
      return when (unionValue) {
        "none" -> NONE
        "native" -> NATIVE
        "skia" -> SKIA
        else -> NONE
      }
    }
  }
}
