package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Log
import androidx.camera.camera2.interop.cameraCharacteristics
import androidx.camera.camera2.interop.cameraId
import androidx.camera.core.CameraInfo

val CameraInfo.cameraIdOrNull: String?
  get() {
    try {
      return cameraId
    } catch (_: IllegalArgumentException) {
      Log.w("VisionCamera", "Camera Device $this is not a Camera2 device!")
      return null
    }
  }

val CameraInfo.cameraCharacteristicsOrNull: CameraCharacteristics?
  get() {
    try {
      return cameraCharacteristics
    } catch (_: IllegalArgumentException) {
      Log.w("VisionCamera", "Camera Device $this is not a Camera2 device!")
      return null
    }
  }
