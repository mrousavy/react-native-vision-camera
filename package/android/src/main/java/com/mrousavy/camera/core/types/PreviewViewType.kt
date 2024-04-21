package com.mrousavy.camera.core.types

import androidx.camera.view.PreviewView
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class PreviewViewType(override val unionValue: String) : JSUnionValue {
  SURFACE_VIEW("surface-view"),
  TEXTURE_VIEW("texture-view");

  fun toPreviewImplementationMode(): PreviewView.ImplementationMode =
    when (this) {
      SURFACE_VIEW -> PreviewView.ImplementationMode.PERFORMANCE
      TEXTURE_VIEW -> PreviewView.ImplementationMode.COMPATIBLE
    }

  companion object : JSUnionValue.Companion<PreviewViewType> {
    override fun fromUnionValue(unionValue: String?): PreviewViewType =
      when (unionValue) {
        "surface-view" -> SURFACE_VIEW
        "texture-view" -> TEXTURE_VIEW
        else -> throw InvalidTypeScriptUnionError("androidPreviewViewType", unionValue)
      }
  }
}
