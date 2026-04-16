package com.margelo.nitro.camera.extensions

import com.margelo.nitro.camera.Orientation

val Orientation.degrees: Int
  get() {
    return when (this) {
      Orientation.UP -> 0
      Orientation.DOWN -> 180
      Orientation.LEFT -> 270
      Orientation.RIGHT -> 90
    }
  }

fun Orientation.Companion.fromDegrees(degrees: Int): Orientation {
  val normalizedDegrees = normalizeDegrees(degrees)
  return when (normalizedDegrees) {
    in 45..135 -> Orientation.LEFT
    in 135..225 -> Orientation.DOWN
    in 225..315 -> Orientation.RIGHT
    else -> Orientation.UP
  }
}

private fun Orientation.Companion.normalizeDegrees(degrees: Int): Int {
  val normalized = degrees % 360
  if (normalized < 0) {
    return normalized + 360
  }
  return normalized
}

/**
 * Returns the logical counter-orientation
 * of this current Orientation, aka flipping it.
 */
fun Orientation.counterRotated(): Orientation {
  return when (this) {
    Orientation.UP -> Orientation.UP
    Orientation.DOWN -> Orientation.DOWN
    Orientation.LEFT -> Orientation.RIGHT
    Orientation.RIGHT -> Orientation.LEFT
  }
}
