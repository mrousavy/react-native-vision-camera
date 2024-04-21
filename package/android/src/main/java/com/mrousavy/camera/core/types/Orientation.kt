package com.mrousavy.camera.core.types

import android.view.Surface

enum class Orientation(override val unionValue: String) : JSUnionValue {
  PORTRAIT("portrait"),
  LANDSCAPE_RIGHT("landscape-right"),
  PORTRAIT_UPSIDE_DOWN("portrait-upside-down"),
  LANDSCAPE_LEFT("landscape-left");

  fun toSurfaceRotation(): Int =
    when (this) {
      PORTRAIT -> Surface.ROTATION_0
      LANDSCAPE_LEFT -> Surface.ROTATION_90
      PORTRAIT_UPSIDE_DOWN -> Surface.ROTATION_180
      LANDSCAPE_RIGHT -> Surface.ROTATION_270
    }

  companion object : JSUnionValue.Companion<Orientation> {
    override fun fromUnionValue(unionValue: String?): Orientation =
      when (unionValue) {
        "portrait" -> PORTRAIT
        "landscape-right" -> LANDSCAPE_RIGHT
        "portrait-upside-down" -> PORTRAIT_UPSIDE_DOWN
        "landscape-left" -> LANDSCAPE_LEFT
        else -> PORTRAIT
      }

    fun fromRotationDegrees(rotationDegrees: Int): Orientation =
      when (rotationDegrees) {
        in 45..135 -> LANDSCAPE_LEFT
        in 135..225 -> PORTRAIT_UPSIDE_DOWN
        in 225..315 -> LANDSCAPE_RIGHT
        else -> PORTRAIT
      }
  }
}
