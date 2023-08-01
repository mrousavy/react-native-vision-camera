package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraDevice

fun parseCameraError(error: Int): String {
  return when (error) {
    CameraDevice.StateCallback.ERROR_CAMERA_IN_USE -> "camera-already-in-use"
    CameraDevice.StateCallback.ERROR_MAX_CAMERAS_IN_USE -> "too-many-open-cameras"
    CameraDevice.StateCallback.ERROR_CAMERA_DISABLED -> "camera-is-disabled-by-android"
    CameraDevice.StateCallback.ERROR_CAMERA_DEVICE -> "unknown-camera-device-error"
    CameraDevice.StateCallback.ERROR_CAMERA_SERVICE -> "unknown-fatal-camera-service-error"
    else -> "unknown-error"
  }
}
