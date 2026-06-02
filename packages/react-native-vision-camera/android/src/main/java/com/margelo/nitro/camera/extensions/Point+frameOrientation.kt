package com.margelo.nitro.camera.extensions

import com.margelo.nitro.camera.CameraOrientation
import com.margelo.nitro.camera.Point

fun Point.rawBufferPointToFramePoint(
  orientation: CameraOrientation,
  isMirrored: Boolean,
  width: Double,
  height: Double,
): Point {
  val oriented =
    when (orientation) {
      CameraOrientation.RIGHT -> Point(y, width - x)
      CameraOrientation.LEFT -> Point(height - y, x)
      CameraOrientation.DOWN -> Point(width - x, height - y)
      CameraOrientation.UP -> this
    }

  if (!isMirrored) return oriented

  val orientedWidth =
    when (orientation) {
      CameraOrientation.LEFT, CameraOrientation.RIGHT -> height
      CameraOrientation.UP, CameraOrientation.DOWN -> width
    }
  return Point(orientedWidth - oriented.x, oriented.y)
}

fun Point.framePointToRawBufferPoint(
  orientation: CameraOrientation,
  isMirrored: Boolean,
  width: Double,
  height: Double,
): Point {
  val orientedWidth =
    when (orientation) {
      CameraOrientation.LEFT, CameraOrientation.RIGHT -> height
      CameraOrientation.UP, CameraOrientation.DOWN -> width
    }
  val unmirrored = if (isMirrored) Point(orientedWidth - x, y) else this

  return when (orientation) {
    CameraOrientation.RIGHT -> Point(width - unmirrored.y, unmirrored.x)
    CameraOrientation.LEFT -> Point(unmirrored.y, height - unmirrored.x)
    CameraOrientation.DOWN -> Point(width - unmirrored.x, height - unmirrored.y)
    CameraOrientation.UP -> unmirrored
  }
}
