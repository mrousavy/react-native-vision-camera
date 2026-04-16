package com.margelo.nitro.camera.extensions.converters

import androidx.camera.view.PreviewView
import com.margelo.nitro.camera.PreviewResizeMode

fun PreviewResizeMode.toScaleType(): PreviewView.ScaleType {
  return when (this) {
    PreviewResizeMode.COVER -> PreviewView.ScaleType.FILL_CENTER
    PreviewResizeMode.CONTAIN -> PreviewView.ScaleType.FIT_CENTER
  }
}
