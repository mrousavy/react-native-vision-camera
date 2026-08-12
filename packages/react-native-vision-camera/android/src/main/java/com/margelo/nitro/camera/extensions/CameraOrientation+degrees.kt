package com.margelo.nitro.camera.extensions

import com.margelo.nitro.camera.CameraOrientation

val CameraOrientation.degrees: Int
  get() {
    return when (this) {
      CameraOrientation.UP -> 0
      CameraOrientation.DOWN -> 180
      CameraOrientation.LEFT -> 270
      CameraOrientation.RIGHT -> 90
    }
  }

fun CameraOrientation.Companion.fromDegrees(degrees: Int): CameraOrientation? =
  when (degrees) {
    in 0 until 45, in 315 until 360 -> CameraOrientation.UP
    in 45 until 135 -> CameraOrientation.LEFT
    in 135 until 225 -> CameraOrientation.DOWN
    in 225 until 315 -> CameraOrientation.RIGHT
    else -> null
  }

/**
 * Returns the logical counter-orientation
 * of this current CameraOrientation, aka flipping it.
 */
fun CameraOrientation.counterRotated(): CameraOrientation {
  return when (this) {
    CameraOrientation.UP -> CameraOrientation.UP
    CameraOrientation.DOWN -> CameraOrientation.DOWN
    CameraOrientation.LEFT -> CameraOrientation.RIGHT
    CameraOrientation.RIGHT -> CameraOrientation.LEFT
  }
}
