package com.mrousavy.camera.types

import android.graphics.Point
import android.graphics.PointF
import android.util.Log
import android.util.Size
import com.mrousavy.camera.core.CameraDeviceDetails

enum class Orientation(override val unionValue: String) : JSUnionValue {
  PORTRAIT("portrait"),
  LANDSCAPE_RIGHT("landscape-right"),
  PORTRAIT_UPSIDE_DOWN("portrait-upside-down"),
  LANDSCAPE_LEFT("landscape-left");

  fun toDegrees(): Int =
    when (this) {
      PORTRAIT -> 0
      LANDSCAPE_LEFT -> 90
      PORTRAIT_UPSIDE_DOWN -> 180
      LANDSCAPE_RIGHT -> 270
    }

  fun toSensorRelativeOrientation(deviceDetails: CameraDeviceDetails): Orientation {
    // Convert target orientation to rotation degrees (0, 90, 180, 270)
    var rotationDegrees = this.toDegrees()

    // Reverse device orientation for front-facing cameras
    if (deviceDetails.lensFacing == LensFacing.FRONT) {
      rotationDegrees = -rotationDegrees
    }

    // Rotate sensor rotation by target rotation
    val newRotationDegrees = (deviceDetails.sensorOrientation + rotationDegrees + 360) % 360

    return fromRotationDegrees(newRotationDegrees)
  }

  companion object : JSUnionValue.Companion<Orientation> {
    override fun fromUnionValue(unionValue: String?): Orientation =
      when (unionValue) {
        "portrait" -> PORTRAIT
        "landscape-right" -> LANDSCAPE_RIGHT
        "portrait-upside-down" -> PORTRAIT_UPSIDE_DOWN
        "landscape-left" -> LANDSCAPE_LEFT
        else -> PORTRAIT
      }

    fun fromRotationDegrees(rotationDegrees: Int): Orientation =
      when (rotationDegrees) {
        in 45..135 -> LANDSCAPE_LEFT
        in 135..225 -> PORTRAIT_UPSIDE_DOWN
        in 225..315 -> LANDSCAPE_RIGHT
        else -> PORTRAIT
      }

    fun rotatePoint(
      point: Point,
      fromSize: Size,
      toSize: Size,
      fromOrientation: Orientation,
      toOrientation: Orientation
    ): Point {
      val differenceDegrees = (fromOrientation.toDegrees() + toOrientation.toDegrees()) % 360
      val difference = Orientation.fromRotationDegrees(differenceDegrees)
      val normalizedPoint = PointF(point.x / fromSize.width.toFloat(), point.y / fromSize.height.toFloat())

      val rotatedNormalizedPoint = when (difference) {
        PORTRAIT -> normalizedPoint
        PORTRAIT_UPSIDE_DOWN -> PointF(1 - normalizedPoint.x, 1 - normalizedPoint.y)
        LANDSCAPE_LEFT -> PointF(normalizedPoint.y, 1 - normalizedPoint.x)
        LANDSCAPE_RIGHT -> PointF(1 - normalizedPoint.y, normalizedPoint.x)
      }

      val rotatedX = rotatedNormalizedPoint.x * toSize.width
      val rotatedY = rotatedNormalizedPoint.y * toSize.height
      Log.i("ROTATE", "$point -> $normalizedPoint -> $difference -> $rotatedX, $rotatedY")
      return Point(rotatedX.toInt(), rotatedY.toInt())
    }
  }
}
