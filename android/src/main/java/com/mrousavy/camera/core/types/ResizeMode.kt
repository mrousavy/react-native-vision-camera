package com.mrousavy.camera.core.types

import androidx.camera.view.PreviewView
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class ResizeMode(override val unionValue: String) : JSUnionValue {
  COVER("cover"),
  CONTAIN("contain");

  fun toScaleType(): PreviewView.ScaleType =
    when (this) {
      COVER -> PreviewView.ScaleType.FILL_CENTER
      CONTAIN -> PreviewView.ScaleType.FIT_CENTER
    }

  companion object : JSUnionValue.Companion<ResizeMode> {
    override fun fromUnionValue(unionValue: String?): ResizeMode =
      when (unionValue) {
        "cover" -> COVER
        "contain" -> CONTAIN
        else -> throw InvalidTypeScriptUnionError("resizeMode", unionValue)
      }
  }
}
