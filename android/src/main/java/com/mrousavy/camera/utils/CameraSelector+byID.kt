package com.mrousavy.camera.utils

import android.annotation.SuppressLint
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.CameraSelector
import java.lang.IllegalArgumentException

/**
 * Create a new [CameraSelector] which selects the camera with the given [cameraId]
 */
@SuppressLint("UnsafeOptInUsageError")
fun CameraSelector.Builder.byID(cameraId: String): CameraSelector.Builder {
  return this.addCameraFilter { cameras ->
    cameras.filter { cameraInfoX ->
      try {
        val cameraInfo = Camera2CameraInfo.from(cameraInfoX)
        return@filter cameraInfo.cameraId == cameraId
      } catch (e: IllegalArgumentException) {
        // Occurs when the [cameraInfoX] is not castable to a Camera2 Info object.
        // We can ignore this error because the [getAvailableCameraDevices()] func only returns Camera2 devices.
        return@filter false
      }
    }
  }
}
