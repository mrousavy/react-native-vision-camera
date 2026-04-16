package com.margelo.nitro.camera.extensions.converters

import androidx.camera.view.PreviewView
import com.margelo.nitro.camera.PreviewImplementationMode

fun PreviewImplementationMode.toImplementationMode(): PreviewView.ImplementationMode {
  return when (this) {
    PreviewImplementationMode.PERFORMANCE -> PreviewView.ImplementationMode.PERFORMANCE
    PreviewImplementationMode.COMPATIBLE -> PreviewView.ImplementationMode.COMPATIBLE
  }
}
