package com.mrousavy.camera.types

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
    val newRotationDegrees = (deviceDetails.sensorOrientation.toDegrees() + rotationDegrees + 360) % 360

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
  }
}
