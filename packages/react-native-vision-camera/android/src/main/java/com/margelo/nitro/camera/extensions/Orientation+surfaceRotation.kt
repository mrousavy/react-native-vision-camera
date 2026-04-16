package com.margelo.nitro.camera.extensions

import android.view.Surface
import androidx.camera.core.impl.ImageOutputConfig
import com.margelo.nitro.camera.Orientation

fun Orientation.Companion.fromSurfaceRotation(
  @ImageOutputConfig.RotationValue surfaceRotation: Int,
): Orientation {
  return when (surfaceRotation) {
    Surface.ROTATION_0 -> Orientation.UP
    Surface.ROTATION_180 -> Orientation.DOWN
    Surface.ROTATION_90 -> Orientation.RIGHT
    Surface.ROTATION_270 -> Orientation.LEFT
    else -> throw Error("Invalid Surface Rotation value: $surfaceRotation")
  }
}

@ImageOutputConfig.RotationValue
val Orientation.surfaceRotation: Int
  get() {
    return when (this) {
      Orientation.UP -> Surface.ROTATION_0
      Orientation.DOWN -> Surface.ROTATION_180
      Orientation.LEFT -> Surface.ROTATION_270
      Orientation.RIGHT -> Surface.ROTATION_90
    }
  }
