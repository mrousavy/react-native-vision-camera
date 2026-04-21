package com.margelo.nitro.camera.extensions

import android.view.Surface
import androidx.camera.core.impl.ImageOutputConfig
import com.margelo.nitro.camera.CameraOrientation

fun CameraOrientation.Companion.fromSurfaceRotation(
  @ImageOutputConfig.RotationValue surfaceRotation: Int,
): CameraOrientation {
  return when (surfaceRotation) {
    Surface.ROTATION_0 -> CameraOrientation.UP
    Surface.ROTATION_180 -> CameraOrientation.DOWN
    Surface.ROTATION_90 -> CameraOrientation.RIGHT
    Surface.ROTATION_270 -> CameraOrientation.LEFT
    else -> throw Error("Invalid Surface Rotation value: $surfaceRotation")
  }
}

@ImageOutputConfig.RotationValue
val CameraOrientation.surfaceRotation: Int
  get() {
    return when (this) {
      CameraOrientation.UP -> Surface.ROTATION_0
      CameraOrientation.DOWN -> Surface.ROTATION_180
      CameraOrientation.LEFT -> Surface.ROTATION_270
      CameraOrientation.RIGHT -> Surface.ROTATION_90
    }
  }
