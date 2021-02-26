package com.mrousavy.camera.utils

import android.util.Size
import android.view.Surface

/**
 * Rotate by a given Surface Rotation
 */
fun Size.rotated(surfaceRotation: Int): Size {
  return when (surfaceRotation) {
    Surface.ROTATION_0 -> Size(width, height)
    Surface.ROTATION_90 -> Size(height, width)
    Surface.ROTATION_180 -> Size(width, height)
    Surface.ROTATION_270 -> Size(height, width)
    else -> Size(width, height)
  }
}
