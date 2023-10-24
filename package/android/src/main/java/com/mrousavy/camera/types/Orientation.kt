package com.mrousavy.camera.types

import android.hardware.camera2.CameraCharacteristics

enum class Orientation(override val unionValue: String) : JSUnionValue {
  PORTRAIT("portrait"),
  LANDSCAPE_RIGHT("landscape-right"),
  PORTRAIT_UPSIDE_DOWN("portrait-upside-down"),
  LANDSCAPE_LEFT("landscape-left");

  fun toDegrees(): Int =
    when (this) {
      PORTRAIT -> 0
      LANDSCAPE_RIGHT -> 90
      PORTRAIT_UPSIDE_DOWN -> 180
      LANDSCAPE_LEFT -> 270
    }

  fun toSensorRelativeOrientation(cameraCharacteristics: CameraCharacteristics): Orientation {
    val sensorOrientation = cameraCharacteristics.get(CameraCharacteristics.SENSOR_ORIENTATION)!!

    // Convert target orientation to rotation degrees (0, 90, 180, 270)
    var rotationDegrees = this.toDegrees()

    // Reverse device orientation for front-facing cameras
    val facingFront = cameraCharacteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT
    if (facingFront) rotationDegrees = -rotationDegrees

    // Rotate sensor rotation by target rotation
    val newRotationDegrees = (sensorOrientation + rotationDegrees + 360) % 360

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
        in 45..135 -> LANDSCAPE_RIGHT
        in 135..225 -> PORTRAIT_UPSIDE_DOWN
        in 225..315 -> LANDSCAPE_LEFT
        else -> PORTRAIT
      }
  }
}
