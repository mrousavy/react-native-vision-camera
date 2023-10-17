package com.mrousavy.camera.types

import android.hardware.camera2.CameraDevice

enum class CameraDeviceError(override val unionValue: String) : JSUnionValue {
  CAMERA_ALREADY_IN_USE("camera-already-in-use"),
  TOO_MANY_OPEN_CAMERAS("too-many-open-cameras"),
  CAMERA_IS_DISABLED_BY_ANDROID("camera-is-disabled-by-android"),
  UNKNOWN_CAMERA_DEVICE_ERROR("unknown-camera-device-error"),
  UNKNOWN_FATAL_CAMERA_SERVICE_ERROR("unknown-fatal-camera-service-error"),
  DISCONNECTED("camera-has-been-disconnected");

  companion object {
    fun fromCameraDeviceError(cameraDeviceError: Int): CameraDeviceError =
      when (cameraDeviceError) {
        CameraDevice.StateCallback.ERROR_CAMERA_IN_USE -> CAMERA_ALREADY_IN_USE
        CameraDevice.StateCallback.ERROR_MAX_CAMERAS_IN_USE -> TOO_MANY_OPEN_CAMERAS
        CameraDevice.StateCallback.ERROR_CAMERA_DISABLED -> CAMERA_IS_DISABLED_BY_ANDROID
        CameraDevice.StateCallback.ERROR_CAMERA_DEVICE -> UNKNOWN_CAMERA_DEVICE_ERROR
        CameraDevice.StateCallback.ERROR_CAMERA_SERVICE -> UNKNOWN_FATAL_CAMERA_SERVICE_ERROR
        else -> UNKNOWN_CAMERA_DEVICE_ERROR
      }
  }
}
