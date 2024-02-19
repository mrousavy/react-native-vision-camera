package com.mrousavy.camera.extensions

import android.graphics.Point
import android.graphics.PointF
import android.util.Log
import android.util.Size
import com.mrousavy.camera.types.Orientation

fun Point.rotatedBy(fromSize: Size, toSize: Size, fromOrientation: Orientation, toOrientation: Orientation): Point {
  val differenceDegrees = (fromOrientation.toDegrees() + toOrientation.toDegrees()) % 360
  val difference = Orientation.fromRotationDegrees(differenceDegrees)
  val normalizedPoint = PointF(this.x / fromSize.width.toFloat(), this.y / fromSize.height.toFloat())

  val rotatedNormalizedPoint = when (difference) {
    Orientation.PORTRAIT -> normalizedPoint
    Orientation.PORTRAIT_UPSIDE_DOWN -> PointF(1 - normalizedPoint.x, 1 - normalizedPoint.y)
    Orientation.LANDSCAPE_LEFT -> PointF(normalizedPoint.y, 1 - normalizedPoint.x)
    Orientation.LANDSCAPE_RIGHT -> PointF(1 - normalizedPoint.y, normalizedPoint.x)
  }

  val rotatedX = rotatedNormalizedPoint.x * toSize.width
  val rotatedY = rotatedNormalizedPoint.y * toSize.height
  Log.i("ROTATE", "$this -> $normalizedPoint -> $difference -> $rotatedX, $rotatedY")
  return Point(rotatedX.toInt(), rotatedY.toInt())
}
