package com.mrousavy.camera.types

enum class QualityPrioritization(override val unionValue: String) : JSUnionValue {
  SPEED("speed"),
  BALANCED("balanced"),
  QUALITY("quality");

  companion object : JSUnionValue.Companion<QualityPrioritization> {
    override fun fromUnionValue(unionValue: String?): QualityPrioritization =
      when (unionValue) {
        "speed" -> SPEED
        "balanced" -> BALANCED
        "quality" -> QUALITY
        else -> BALANCED
      }
  }
}
