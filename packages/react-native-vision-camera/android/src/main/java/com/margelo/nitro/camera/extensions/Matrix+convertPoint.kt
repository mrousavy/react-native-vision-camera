package com.margelo.nitro.camera.extensions

import android.graphics.Matrix
import com.margelo.nitro.camera.Point

fun Matrix.convertPoint(point: Point): Point {
  val coordinates = floatArrayOf(point.x.toFloat(), point.y.toFloat())
  this.mapPoints(coordinates)
  return Point(coordinates[0].toDouble(), coordinates[1].toDouble())
}
