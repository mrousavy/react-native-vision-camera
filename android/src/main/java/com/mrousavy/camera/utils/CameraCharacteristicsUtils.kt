package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import com.cuvent.experiences.friends.camera.parsers.bigger
import com.cuvent.experiences.friends.camera.parsers.parseLensFacing
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
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
    // TODO: Check if getDeviceType() works correctly, even for logical multi-cameras
    val focalLengths = this.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)!!
    val sensorSize = this.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!

    // To get valid focal length standards we have to upscale to the 35mm measurement (film standard)
    val cropFactor = Size35mm.bigger / sensorSize.bigger

    val deviceTypes = Arguments.createArray()

    val containsTelephoto = focalLengths.any { l -> (l * cropFactor) > 35 } // TODO: Telephoto lenses are > 85mm, but we don't have anything between that range..
    //val containsNormalLens = focalLengths.any { l -> (l * cropFactor) > 35 && (l * cropFactor) <= 55 }
    val containsWideAngle = focalLengths.any { l -> (l * cropFactor) >= 24 && (l * cropFactor) <= 35 }
    val containsUltraWideAngle = focalLengths.any { l -> (l * cropFactor) < 24 }

    if (containsTelephoto)
        deviceTypes.pushString("telephoto-camera")
    if (containsWideAngle)
        deviceTypes.pushString("wide-angle-camera")
    if (containsUltraWideAngle)
        deviceTypes.pushString("ultra-wide-angle-camera")

    return deviceTypes
}

fun CameraCharacteristics.getFieldOfView(): Double {
    val focalLengths = this.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)!!
    val sensorSize = this.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!

    return 2 * atan(sensorSize.bigger / (focalLengths[0] * 2)) * (180 / PI)
}

fun CameraCharacteristics.supportsFps(fps: Int): Boolean {
    return this.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)!!
            .any { it.upper >= fps && it.lower <= fps }
}

/**
 * Get the value at which the Zoom is at neutral state (wide-angle camera zoom 0) (in percent, between 0.0-1.0)
 *
 * * On single-camera physical devices this value will always be 0
 * * On devices with multiple cameras, e.g. triple-camera, this value will be a value between 0.0 and 1.0, where the field-of-view and zoom looks "neutral"
 */
val CameraCharacteristics.neutralZoomPercent: Float
    get() {
        val zoomRange = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R)
            this.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
        else null
        return if (zoomRange != null)
            ((1.0f - zoomRange.lower) / (zoomRange.upper - zoomRange.lower))
        else
            0.0f
    }
