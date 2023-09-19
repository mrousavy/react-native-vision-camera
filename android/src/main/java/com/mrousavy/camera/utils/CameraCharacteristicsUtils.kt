package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.mrousavy.camera.parsers.bigger
import kotlin.math.PI
import kotlin.math.atan

// 35mm is 135 film format, a standard in which focal lengths are usually measured
val Size35mm = Size(36, 24)

/**
 * Convert a given array of focal lengths to the corresponding TypeScript union type name.
 *
 * Possible values for single cameras:
 * * `"wide-angle-camera"`
 * * `"ultra-wide-angle-camera"`
 * * `"telephoto-camera"`
 *
 * Sources for the focal length categories:
 * * [Telephoto Lens (wikipedia)](https://en.wikipedia.org/wiki/Telephoto_lens)
 * * [Normal Lens (wikipedia)](https://en.wikipedia.org/wiki/Normal_lens)
 * * [Wide-Angle Lens (wikipedia)](https://en.wikipedia.org/wiki/Wide-angle_lens)
 * * [Ultra-Wide-Angle Lens (wikipedia)](https://en.wikipedia.org/wiki/Ultra_wide_angle_lens)
 */
fun CameraCharacteristics.getDeviceTypes(): ReadableArray {
  val focalLengths = this.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)!!
  val sensorSize = this.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!

  // To get valid focal length standards we have to upscale to the 35mm measurement (film standard)
  val cropFactor = Size35mm.bigger / sensorSize.bigger

  val deviceTypes = Arguments.createArray()

  focalLengths.forEach { focalLength ->
    // scale to the 35mm film standard
    val l = focalLength * cropFactor
    when {
      // https://en.wikipedia.org/wiki/Ultra_wide_angle_lens
      l < 24f -> deviceTypes.pushString("ultra-wide-angle-camera")
      // https://en.wikipedia.org/wiki/Wide-angle_lens
      l in 24f..43f -> deviceTypes.pushString("wide-angle-camera")
      // https://en.wikipedia.org/wiki/Telephoto_lens
      l > 43f -> deviceTypes.pushString("telephoto-camera")
      else -> throw Error("Invalid focal length! (${focalLength}mm)")
    }
  }

  return deviceTypes
}

fun CameraCharacteristics.getFieldOfView(): Double {
  val focalLengths = this.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)!!
  val sensorSize = this.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!

  return 2 * atan(sensorSize.bigger / (focalLengths[0] * 2)) * (180 / PI)
}
